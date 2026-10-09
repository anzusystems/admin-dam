import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The requests of an upload as the server receives them, for each of the four asset types: the start, a chunk,
 * the finish, and the import from an external provider that stands in for all three. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const load = async () => {
  vi.resetModules()

  return await import('@/domains/coreDam/asset/api/fileApi')
}

const types: Array<[DamAssetTypeType, string]> = [
  ['image', 'image/jpeg'],
  ['audio', 'audio/mpeg'],
  ['video', 'video/mp4'],
  ['document', 'application/pdf'],
]

const paths = () => server.requests.map((request) => [request.method, request.url])

/** Whether the request is refused - with whatever reason, or with none: the reason is not what is pinned. */
const refused = (request: Promise<unknown>) =>
  request.then(
    () => false,
    () => true
  )

beforeEach(() => {
  vi.clearAllMocks()
  // The finish hands the row over to the poll, whose timer must not outlive the case.
  vi.useFakeTimers()
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
})

describe.each(types)('the upload requests of the type %s', (assetType, mimeType) => {
  const file = () => new File(['abcde'], 'upload.bin', { type: mimeType })

  it('starts an upload under the licence of the row, with the type and the size of the file', async () => {
    const { uploadStart } = await load()
    const row = queueRow({ assetType, licenceId: 7, assetId: null, fileId: null, file: file() })

    const answer = await uploadStart(row)

    expect(paths()).toEqual([['POST', `/adm/v1/${assetType}/licence/7`]])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ mimeType, size: 5 })
    // The ids of the file and of the asset the server made for it.
    expect(answer).toEqual({ id: 'file-1', asset: 'asset-1' })
  })

  it('starts a slot upload under the asset and the slot it goes into', async () => {
    const { uploadStart } = await load()
    const row = queueRow({
      assetType,
      type: 'slotFile',
      licenceId: 7,
      assetId: 'asset-9',
      fileId: null,
      slotName: 'extra',
      file: file(),
    })

    const answer = await uploadStart(row)

    expect(paths()).toEqual([['POST', `/adm/v1/${assetType}/asset/asset-9/slot-name/extra`]])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ mimeType, size: 5 })
    expect(answer).toEqual({ id: 'file-1', asset: 'asset-9' })
  })

  it('rejects a start the server does not answer with "created"', async () => {
    const { uploadStart } = await load()
    server.on('POST', /\/licence\/7$/, () => ({ status: 200, data: { id: 'file-1', asset: 'asset-1' } }))

    expect(await refused(uploadStart(queueRow({ assetType, licenceId: 7, file: file() })))).toBe(true)
  })

  it('sends a chunk as a form with the bytes and their place in the file', async () => {
    const { uploadChunk } = await load()
    const row = queueRow({ assetType, latestChunkAbortController: new AbortController() })
    const onProgress = vi.fn()
    const bytes = new File(['abcde'], 'upload.bin')

    const answer = await uploadChunk(row, 'file-1', bytes as never, 5, 1024, onProgress)

    expect(paths()).toEqual([['POST', `/adm/v1/${assetType}/file-1/chunk`]])
    const form = server.requests[0].data as FormData
    expect(form).toBeInstanceOf(FormData)
    expect([...form.keys()]).toEqual(['file', 'chunk'])
    expect((form.get('file') as File).size).toBe(5)
    expect(form.get('chunk')).toBe('{"offset":1024,"size":5}')
    const config = server.requests[0].config
    // Longer than the client's own timeout: a chunk is the one request that takes its time.
    expect(config.timeout).toBe(420_000)
    // The signal that Stop aborts.
    expect(config.signal).toBe(row.latestChunkAbortController?.signal)
    expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' })
    expect(config.onUploadProgress).toBe(onProgress)
    expect(answer).toEqual({})
  })

  it('rejects a chunk the server does not answer with "created"', async () => {
    const { uploadChunk } = await load()
    server.on('POST', /\/chunk$/, () => ({ status: 200, data: {} }))

    expect(await refused(uploadChunk(queueRow({ assetType }), 'file-1', 'bytes', 5, 0, undefined))).toBe(true)
  })

  it('finishes the upload of the file with the checksum of what was sent', async () => {
    const { uploadFinish } = await load()
    const row = queueRow({ assetType, fileId: 'file-4' })

    await uploadFinish(row, 'checksum-of-the-file')

    expect(paths()).toEqual([['PATCH', `/adm/v1/${assetType}/file-4/uploaded`]])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ checksum: 'checksum-of-the-file' })
    // From here the server works on the file.
    expect(row.status).toBe('processing')
  })

  it('rejects a finish the server does not answer with "ok", and leaves the row uploading', async () => {
    const { uploadFinish } = await load()
    server.on('PATCH', /\/uploaded$/, () => ({ status: 201, data: {} }))
    const row = queueRow({ assetType, fileId: 'file-4' })

    expect(await refused(uploadFinish(row, 'checksum'))).toBe(true)

    expect(row.status).toBe('uploading')
  })

  it('imports from an external provider under the licence of the row, by the id the provider knows', async () => {
    const { externalProviderUpload } = await load()
    const row = queueRow({
      assetType,
      type: 'externalProviderAsset',
      licenceId: 7,
      assetId: null,
      fileId: null,
      externalProviderAssetId: 'photo-9',
      externalProviderName: 'unsplash',
    })

    const answer = await externalProviderUpload(row)

    expect(paths()).toEqual([['POST', `/adm/v1/${assetType}/licence/7/external-provider`]])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ id: 'photo-9', externalProvider: 'unsplash' })
    expect(answer).toEqual({ id: 'file-1', asset: 'asset-1' })
  })

  it('rejects an import the server does not answer with "created"', async () => {
    const { externalProviderUpload } = await load()
    server.on('POST', /\/external-provider$/, () => ({ status: 200, data: {} }))

    expect(await refused(externalProviderUpload(queueRow({ assetType, licenceId: 7 })))).toBe(true)
  })
})

describe('what the start request says about the file', () => {
  it('names the type of a file the browser could not name, by its extension', async () => {
    const { uploadStart } = await load()

    await uploadStart(queueRow({ assetType: 'video', file: new File(['abc'], 'clip.MOV') }))
    await uploadStart(queueRow({ assetType: 'document', file: new File(['abc'], 'profile.icc') }))
    await uploadStart(queueRow({ assetType: 'document', file: new File(['abc'], 'notes.xyz') }))

    expect(server.requests.map((request) => JSON.parse(request.data as string))).toEqual([
      { mimeType: 'video/quicktime', size: 3 },
      { mimeType: 'application/vnd.iccprofile', size: 3 },
      { mimeType: '', size: 3 },
    ])
  })

  it('starts a slot row that has no slot or no asset as an ordinary upload under the licence', async () => {
    const { uploadStart } = await load()
    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' })

    await uploadStart(queueRow({ type: 'slotFile', assetId: 'asset-9', slotName: null, file }))
    await uploadStart(queueRow({ type: 'slotFile', assetId: null, slotName: 'extra', file }))

    expect(paths()).toEqual([
      ['POST', '/adm/v1/image/licence/1'],
      ['POST', '/adm/v1/image/licence/1'],
    ])
  })
})
