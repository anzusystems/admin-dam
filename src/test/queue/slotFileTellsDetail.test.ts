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

/* A file sent into another slot of an asset than its main one, with no notification delivered: the poll of the queue
 * reads the list of the slots of the asset and settles the row by its file. The server fills in the metadata of an
 * asset that is not described from whichever of its files it processes first, so a detail that holds the asset is
 * told of that file as of its main one, and its page reads the asset; "Save" is held back meanwhile, the form being
 * older than what the server filled in. The real upload, poll and stores over a fake server; the page is a stand-in
 * that says when it is told. */

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
// Far enough for one read of the poll, whatever its rhythm.
const ONE_READ = 20_000

/** The asset as the detail holds it: its main file processed, the asset described or not. */
const held = (described: boolean) =>
  assetDetail('asset-1', {
    mainFile: assetFile('file-main', 'processed', { asset: 'asset-1' }),
    flags: { described, visible: true },
  }) as unknown as AssetDetailItemDto

/** One file sent into the slot `extra` of `asset-1`, as far as the server's answer to its finish request, with the
 * detail holding the asset and its page listening. */
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

/** What the slot `extra` of `asset-1` holds: the file of the upload, in the state the server has brought it to. */
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

/* The poll settled the row and told the detail nothing: the detail heard of its main file alone. */
describe('a slot upload settled processed by the poll of its queue', () => {
  it('tells the page of the detail that holds its asset, and holds "Save" back until the page has read it', async () => {
    const { row, detailStore, pageTold } = await processingSlotUpload()
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, pageTold.mock.calls.length, detailStore.saveHeldBack]).toEqual(['uploaded', 1, true])
  })

  // The guard: the server leaves the metadata of an asset that is described alone.
  it('tells nothing to the detail of an asset that is described', async () => {
    const { row, detailStore, pageTold } = await processingSlotUpload(true)
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, pageTold.mock.calls.length, detailStore.saveHeldBack]).toEqual(['uploaded', 0, false])
  })
})
