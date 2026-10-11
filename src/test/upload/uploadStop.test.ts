import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { seedDamConfig } from '@/test/support/fakeDam'

const uploadChunk = vi.fn(async (): Promise<unknown> => ({}))
const uploadFinish = vi.fn(async (): Promise<unknown> => ({}))
const uploadStart = vi.fn(async () => ({ asset: 'asset-1', id: 'file-1' }))
const abort = vi.spyOn(AbortController.prototype, 'abort')

// The sixth argument is the progress callback the service hands to axios.
let onChunkProgress: ((event: { loaded: number; total: number }) => void) | undefined = undefined
vi.mock('@/domains/coreDam/asset/api/fileApi', () => ({
  uploadChunk: (...args: unknown[]) => {
    onChunkProgress = args[5] as typeof onChunkProgress

    return uploadChunk(...(args as []))
  },
  uploadFinish: (...args: unknown[]) => uploadFinish(...(args as [])),
  uploadStart: (...args: unknown[]) => uploadStart(...(args as [])),
}))

// happy-dom's FileReader never fires its `onload` here, and `readFile` is module-private, so the chunk loop would
// hang on the very first read.
let releaseRead: (() => void) | null = null
let holdReads = false

class FileReaderStub {
  static readonly DONE = 2
  readyState = 0
  result: unknown = null
  onload: ((event: { target: FileReaderStub }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readAsArrayBuffer(blob: Blob) {
    const done = () => {
      this.readyState = FileReaderStub.DONE
      this.result = new ArrayBuffer(blob.size)
      this.onload?.({ target: this })
    }
    // Held open when a test wants to stop the upload while a chunk is being read off disk.
    if (holdReads) releaseRead = done
    else void Promise.resolve().then(done)
  }
}

const queueItem = () => ({
  file: new File(['abcdefghijklmnop'], 'clip.mp4'),
  fileId: 'file-1',
  assetId: 'asset-1',
  status: 'waiting',
  currentChunkIndex: 0,
  latestChunkAbortController: null as null | AbortController,
  progress: { speed: 0, remainingTime: 0, progressPercent: 0 },
  error: { hasError: false, message: '' },
})

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  // Chunks of 4 bytes and no other size, so the loop below runs exactly as many times as the file has chunks. The
  // run is the library's, which reads the size from the DAM config.
  seedDamConfig(useDamConfigStore(), 4)

  return await import('@/domains/coreDam/shared/services/upload/uploadService')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('FileReader', FileReaderStub)
  releaseRead = null
  holdReads = false
  uploadChunk.mockImplementation(async () => ({}))
  // `clearAllMocks` keeps implementations, and one case below holds this one open.
  uploadFinish.mockImplementation(async () => ({}))
  uploadStart.mockImplementation(async () => ({ asset: 'asset-1', id: 'file-1' }))
})

describe('measuring the speed', () => {
  it('never reports a negative speed after a retried chunk', async () => {
    vi.useFakeTimers()
    const { useUpload } = await load()
    const item = queueItem()
    const speeds: number[] = []
    const { upload, uploadInit } = useUpload(item as never, (_progress: number, speed: number) => {
      speeds.push(speed)
    })
    await uploadInit()
    // Held open, or the upload finishes and stops the speed check before the retry is ever reported.
    uploadFinish.mockImplementation(() => new Promise(() => undefined))
    let attempt = 0
    uploadChunk.mockImplementation(async () => {
      attempt++
      // Two events per attempt, a long time apart in the one that fails.
      onChunkProgress?.({ loaded: 1, total: 1_000_000 })
      vi.setSystemTime(Date.now() + (attempt === 1 ? 100_000 : 1_000))
      onChunkProgress?.({ loaded: attempt === 1 ? 999_999 : 2, total: 1_000_000 })
      if (attempt === 1) throw new Error('network')

      return {}
    })

    void upload().catch(() => undefined)
    await vi.advanceTimersByTimeAsync(10_000)
    vi.useRealTimers()

    expect(attempt).toBeGreaterThan(1)
    // The meter reports once, and only after the retry: the attempt that failed threw its measure away without a
    // word, and the chunks after it went by with no tick of its timer between them.
    expect(speeds.length).toBeGreaterThan(0)
    expect(speeds.every((speed) => speed >= 0)).toBe(true)
  })
})

describe('measuring a retry', () => {
  it('measures a retried chunk over its own time, not over the attempt that failed', async () => {
    vi.useFakeTimers()
    const { useUpload } = await load()
    const item = queueItem()
    const speeds: number[] = []
    const { upload, uploadInit } = useUpload(item as never, (_progress: number, speed: number) => {
      speeds.push(speed)
    })
    await uploadInit()
    uploadFinish.mockImplementation(() => new Promise(() => undefined))
    let attempt = 0
    uploadChunk.mockImplementation(async () => {
      attempt++
      if (attempt === 1) {
        // One event, then a request that hangs for a minute and a half before it gives up.
        onChunkProgress?.({ loaded: 1, total: 1_000_000 })
        vi.setSystemTime(Date.now() + 100_000)
        throw new Error('network')
      }
      onChunkProgress?.({ loaded: 1_000, total: 1_000_000 })
      vi.setSystemTime(Date.now() + 1_000)
      onChunkProgress?.({ loaded: 3_000, total: 1_000_000 })

      return {}
    })

    void upload().catch(() => undefined)
    await vi.advanceTimersByTimeAsync(10_000)
    vi.useRealTimers()

    // The file from its retry on, not the minute and a half of the attempt that failed: its four chunks of 4 bytes
    // over the four seconds they took.
    expect(attempt).toBeGreaterThan(1)
    expect(speeds.at(-1)).toBe(4)
  })
})

describe('stopping an upload', () => {
  it('uploads every chunk when nothing stops it', async () => {
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit } = useUpload(item as never)
    await uploadInit()

    await upload()

    // 16 bytes at 4 bytes a chunk.
    expect(uploadChunk).toHaveBeenCalledTimes(4)
    expect(uploadFinish).toHaveBeenCalledTimes(1)
  })

  it('stops between two chunks, and never finishes the upload', async () => {
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit, stop } = useUpload(item as never)
    await uploadInit()
    // The abort controller only covers the chunk in flight; a stop asked for between two of them used
    // to be ignored and the file uploaded to the end anyway.
    uploadChunk.mockImplementationOnce(async () => {
      stop()

      return {}
    })

    await expect(upload()).rejects.toBeDefined()

    expect(uploadChunk).toHaveBeenCalledTimes(1)
    expect(uploadFinish).not.toHaveBeenCalled()
  })

  it('stops during the back-off between two retries of the same chunk', async () => {
    vi.useFakeTimers()
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit, stop } = useUpload(item as never)
    await uploadInit()
    uploadChunk.mockRejectedValue(new Error('network'))

    // Settled through handlers attached in this tick: awaited later, the rejection is reported as
    // unhandled before the assertion reaches it.
    const settled: string[] = []
    const running = upload().then(
      () => settled.push('resolved'),
      () => settled.push('rejected')
    )
    await vi.advanceTimersByTimeAsync(0)
    stop()
    // The retry sleeps a second before the next attempt — the whole window was unguarded.
    await vi.advanceTimersByTimeAsync(2_000)
    vi.useRealTimers()
    await running

    expect(settled).toEqual(['rejected'])
    expect(uploadChunk).toHaveBeenCalledTimes(1)
    expect(uploadFinish).not.toHaveBeenCalled()
  })

  it('stops while a chunk is still being read off disk', async () => {
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit, stop } = useUpload(item as never)
    await uploadInit()
    // Hold the read open: for a large chunk on a slow disk this window is not theoretical.
    holdReads = true
    const settled: string[] = []
    const running = upload().then(
      () => settled.push('resolved'),
      () => settled.push('rejected')
    )

    // Set by the reader itself, so this waits until a chunk really is being read.
    await vi.waitFor(() => expect(releaseRead).not.toBe(null))
    stop()
    releaseRead?.()
    await running

    expect(settled).toEqual(['rejected'])
    // Nothing was on the wire yet, so only the check after the read can catch this.
    expect(uploadChunk).not.toHaveBeenCalled()
    expect(uploadFinish).not.toHaveBeenCalled()
  })

  it('stops while the start request is still on the wire', async () => {
    const { useUpload } = await load()
    const item = queueItem()
    const { uploadInit, stop } = useUpload(item as never)
    // The asset the request creates stays on the server; what must not happen is the file going up.
    uploadStart.mockImplementation(async () => {
      stop()

      return { asset: 'asset-1', id: 'file-1' }
    })

    await expect(uploadInit()).rejects.toBeDefined()

    expect(uploadChunk).not.toHaveBeenCalled()
  })

  it('stops while the last chunk is on the wire', async () => {
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit, stop } = useUpload(item as never)
    await uploadInit()
    // The check at the top of the loop runs before a chunk, so a stop during the last one is only ever caught by the
    // one in front of the finish request.
    uploadChunk.mockImplementation(async () => {
      if (uploadChunk.mock.calls.length === 4) stop()

      return {}
    })

    await expect(upload()).rejects.toBeDefined()

    expect(uploadChunk).toHaveBeenCalledTimes(4)
    expect(uploadFinish).not.toHaveBeenCalled()
  })

  it('gives up on a chunk after the last attempt instead of retrying for ever', async () => {
    vi.useFakeTimers()
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit } = useUpload(item as never)
    await uploadInit()
    uploadChunk.mockRejectedValue(new Error('network'))

    const settled: string[] = []
    const running = upload().then(
      () => settled.push('resolved'),
      () => settled.push('rejected')
    )
    // Exactly the three back-offs the four attempts are separated by.
    await vi.advanceTimersByTimeAsync(13_000)
    vi.useRealTimers()
    await running

    expect(settled).toEqual(['rejected'])
    // Four attempts, and no sleep after the last one - the loop ends there.
    expect(uploadChunk).toHaveBeenCalledTimes(4)
  })

  it('cancels the chunk that is on the wire', async () => {
    const { useUpload } = await load()
    const item = queueItem()
    const { upload, uploadInit, stop } = useUpload(item as never)
    await uploadInit()
    uploadChunk.mockImplementation(() => new Promise(() => undefined))

    void upload().catch(() => undefined)
    // The controller is created after the chunk has been read, so waiting on it is the only sound cue.
    await vi.waitFor(() => expect(item.latestChunkAbortController).not.toBeNull())
    stop()

    expect(abort).toHaveBeenCalledTimes(1)
    expect(item.latestChunkAbortController!.signal.aborted).toBe(true)
  })
})
