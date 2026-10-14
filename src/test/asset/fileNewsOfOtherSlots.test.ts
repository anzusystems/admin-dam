import type { AssetDetailItemDto, UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, assetFile, createFakeDam, queueRow, seedDamConfig } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* What the store of the detail makes of the news of a file of another slot of the asset it holds: the server fills in
 * the metadata of an asset that is not described from whichever of its files it processes first, so the page that
 * draws the detail is told, and reads the asset. Each file once, whichever ways and in whatever order they tell of
 * it. Not once the asset is described: by a save of its metadata, too - the server marks the asset described with
 * every save. The real stores and the real bulk save over a fake server; the page is a stand-in that says when it is
 * told. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

/** An asset as the detail holds it: its main file processed, not described. */
const held = (id: string) =>
  assetDetail(id, {
    mainFile: assetFile('file-main', 'processed', { asset: id }),
    flags: { described: false, visible: true },
  }) as unknown as AssetDetailItemDto

/** The store of the detail holding `asset-1`, and the page that draws it, listening. */
const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const detailStore = useAssetDetailStore()
  detailStore.setAsset(held('asset-1'))
  const pageTold = vi.fn()
  detailStore.tellPageBy(pageTold)

  return { detailStore, pageTold }
}

const PROCESSED = 'processed'

beforeEach(() => {
  vi.clearAllMocks()
  server = createFakeDam()
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/* Only the file told of last was remembered: two files told of in turns - the notification of each, then the read of
 * the queue that settles the row of each - started a read of the asset at every word. */
describe('the news of the files of other slots of the asset the detail holds', () => {
  it('tells the page of each file once, whatever order the news comes in', async () => {
    const { detailStore, pageTold } = await load()

    for (const fileId of ['file-a', 'file-b', 'file-a', 'file-b']) {
      detailStore.fileStatusOnServer('asset-1', fileId, PROCESSED)
    }

    expect(pageTold).toHaveBeenCalledTimes(2)
  })

  // The guard: the files told of are those of the asset held; another one held has its own.
  it('tells the page of the same file of another asset held since', async () => {
    const { detailStore, pageTold } = await load()
    detailStore.fileStatusOnServer('asset-1', 'file-a', PROCESSED)
    detailStore.setAsset(held('asset-2'))

    detailStore.fileStatusOnServer('asset-2', 'file-a', PROCESSED)

    expect(pageTold).toHaveBeenCalledTimes(2)
  })
})

/* Every save sends the asset as described, and the server marks it so; the asset held in the detail was not, and a file
 * processed after the save held "Save" back over what was typed since. */
describe('the news of a file of another slot after a save of the metadata of the asset', () => {
  it('is no news once the mass edit has saved the asset the detail holds', async () => {
    const { detailStore, pageTold } = await load()
    const { bulkUpdateAssetsMetadata } = await import('@/domains/coreDam/asset/api/assetApi')
    const row: UploadQueueItem = queueRow({
      type: 'asset',
      status: 'uploaded',
      assetId: 'asset-1',
      fileId: null,
      canEditMetadata: true,
      keywords: ['typed'],
    })

    await bulkUpdateAssetsMetadata([row])
    detailStore.fileStatusOnServer('asset-1', 'file-a', PROCESSED)

    expect([server.sent('PATCH', BULK).length, pageTold.mock.calls.length, detailStore.saveHeldBack]).toEqual([
      1,
      0,
      false,
    ])
  })
})
