import type { AssetDetailItemDto } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
} from '@/test/support/fakeDam'
import type { FakeAssetFile, FakeDam } from '@/test/support/fakeDam'

/*
 * Without a notification, the poll reads the slot list and settles the row by its own file.
 * The server fills in metadata of an undescribed asset from the first file it processes,
 * so a detail holding the asset is told of that file as its main one and re-reads the asset.
 * "Save" is held back meanwhile because the form is older than the filled-in metadata.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: null } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))

const SLOTS = 'slots'
const ONE_READ = 20_000

const held = (described: boolean) =>
  assetDetail('asset-1', {
    mainFile: assetFile('file-main', 'processed', { asset: 'asset-1' }),
    flags: { described, visible: true },
  }) as unknown as AssetDetailItemDto

const processingSlotUpload = async (described = false) => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const store = useUploadQueuesStore()
  const detailStore = useAssetDetailStore()
  detailStore.setAsset(held(described))
  const pageTold = vi.fn()
  detailStore.tellPageBy(pageTold)
  const [row] = seedQueue(store, SLOTS, [
    queueRow({
      type: 'slotFile',
      status: 'waiting',
      assetId: 'asset-1',
      fileId: null,
      slotName: 'extra',
      file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      displayTitle: 'photo.jpg',
    }),
  ])
  store.processUpload(SLOTS)
  await vi.advanceTimersByTimeAsync(0)
  expect([row.status, row.fileId]).toEqual(['processing', 'file-1'])

  return { row, detailStore, pageTold }
}

const slotFileIs = (status: FakeAssetFile['fileAttributes']['status']) =>
  server.slotFile('asset-1', 'extra', assetFile('file-1', status, { asset: 'asset-1' }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  stubFileReader()
  server = createFakeDam()
  server.asset(held(false) as never)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a slot upload settled processed by the poll of its queue', () => {
  it('tells the page of the detail that holds its asset, and holds "Save" back until the page has read it', async () => {
    const { row, detailStore, pageTold } = await processingSlotUpload()
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, pageTold.mock.calls.length, detailStore.saveHeldBack]).toEqual(['uploaded', 1, true])
  })

  it('tells nothing to the detail of an asset that is described', async () => {
    const { row, detailStore, pageTold } = await processingSlotUpload(true)
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, pageTold.mock.calls.length, detailStore.saveHeldBack]).toEqual(['uploaded', 0, false])
  })
})
