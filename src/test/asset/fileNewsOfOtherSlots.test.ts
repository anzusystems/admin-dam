import type { AssetDetailItemDto, UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, assetFile, createFakeDam, queueRow, seedDamConfig } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/*
 * The detail store and news of a file in another slot of the held asset. The server fills in metadata
 * of an undescribed asset from the first file it processes, so the page is told and reads the asset.
 * Each file once, in any order. Not once the asset is described,
 * also by a metadata save: every save marks the asset described.
 * Real stores and bulk save over a fake server. The page is a stand-in that records when it is told.
 */

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

const held = (id: string) =>
  assetDetail(id, {
    mainFile: assetFile('file-main', 'processed', { asset: id }),
    flags: { described: false, visible: true },
  }) as unknown as AssetDetailItemDto

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

/*
 * Only the last file told of was remembered. Two files told of in turns (a notification
 * each, then the queue read that settles each row) started an asset read for every message.
 */
describe('the news of the files of other slots of the asset the detail holds', () => {
  it('tells the page of each file once, whatever order the news comes in', async () => {
    const { detailStore, pageTold } = await load()

    for (const fileId of ['file-a', 'file-b', 'file-a', 'file-b']) {
      detailStore.fileStatusOnServer('asset-1', fileId, PROCESSED)
    }

    expect(pageTold).toHaveBeenCalledTimes(2)
  })

  it('tells the page of the same file of another asset held since', async () => {
    const { detailStore, pageTold } = await load()
    detailStore.fileStatusOnServer('asset-1', 'file-a', PROCESSED)
    detailStore.setAsset(held('asset-2'))

    detailStore.fileStatusOnServer('asset-2', 'file-a', PROCESSED)

    expect(pageTold).toHaveBeenCalledTimes(2)
  })
})

/*
 * Every save sends the asset as described and the server marks it so. The asset held in the detail
 * was not marked, so a file processed after the save held "Save" back over text typed since.
 */
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
