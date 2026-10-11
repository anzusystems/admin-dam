import type { DamAssetTypeType, UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, forbiddenOperationError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* Which server address a row is sent to: the one of its asset type and no other, and none at all for a type the
 * app does not know. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const load = async () => {
  vi.resetModules()

  return await import('@/domains/coreDam/asset/api/fileApi')
}

type FileApi = Awaited<ReturnType<typeof load>>

const requests: Array<[string, (api: FileApi, row: UploadQueueItem) => Promise<unknown>]> = [
  ['the start', (api, row) => api.uploadStart(row)],
  ['a chunk', (api, row) => api.uploadChunk(row, 'file-1', new Blob(['bytes']), 5, 0, undefined)],
  ['the finish', (api, row) => api.uploadFinish(row, 'checksum')],
  ['the import', (api, row) => api.externalProviderUpload(row)],
]
const types: DamAssetTypeType[] = ['image', 'audio', 'video', 'document']

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
})

describe.each(requests)('%s of an upload', (_name, send) => {
  it.each(types)('goes to the address of the %s type, and only there', async (assetType) => {
    const api = await load()
    const row = queueRow({ assetType, file: new File(['abcde'], 'upload.bin') })

    await send(api, row)

    expect(server.requests).toHaveLength(1)
    expect(server.requests[0].url.startsWith(`/adm/v1/${assetType}/`)).toBe(true)
  })

  it('is refused without a request for a type the app does not know', async () => {
    const api = await load()
    const row = queueRow({ assetType: 'hologram' as never, file: new File(['abcde'], 'upload.bin') })

    // A promise that never settles would hold one of the two places of the queue for good.
    await expect(send(api, row)).rejects.toThrow("fileApi: unsupported asset type 'hologram'")

    expect(server.requests).toEqual([])
    expect(row.status).toBe('uploading')
  })

  it('fails with the error of the server, as it came', async () => {
    const api = await load()
    const refused = forbiddenOperationError('licence_closed')
    server.on('POST', /./, () => {
      throw refused
    })
    server.on('PATCH', /./, () => {
      throw refused
    })

    await expect(send(api, queueRow({ file: new File(['abcde'], 'upload.bin') }))).rejects.toBe(refused)
  })
})
