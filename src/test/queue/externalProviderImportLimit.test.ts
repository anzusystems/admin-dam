import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, queueRow, seedDamConfig, seedQueue } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* An import from an external provider goes into the upload queue next to the uploads, and counts against the same
 * fifty rows. The real import actions and the real store over a fake server. */

let server: FakeDam
const showWarning = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showWarning, showError: vi.fn(), showUnknownError: vi.fn() }),
}))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: 'unsplash' } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))
vi.mock('@/domains/system/auth/auth', () => ({
  ACL: {},
  assetTypeAcl: () => 'acl',
  useAuth: () => ({ can: () => true, canForAll: () => true }),
}))

const GLOBAL = 'global'
const EDIT = 'edit'

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const { useExternalProviderAssetListStore } =
    await import('@/domains/coreDam/externalProvider/store/externalProviderAssetListStore')
  const { useExternalProviderAssetDetailStore } =
    await import('@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore')
  const { useExternalProviderAssetImport } =
    await import('@/domains/coreDam/externalProvider/composables/externalProviderAssetImport')

  return {
    store: useUploadQueuesStore(),
    listStore: useExternalProviderAssetListStore(),
    detailStore: useExternalProviderAssetDetailStore(),
    actions: useExternalProviderAssetImport(),
  }
}

const provided = (id: string) => ({
  id,
  texts: { displayTitle: 'title of ' + id },
  attributes: { assetType: 'image' as const },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: { width: 800 },
})

const settled = (count: number): UploadQueueItem[] =>
  Array.from({ length: count }, (_value, index) => queueRow({ status: 'uploaded', assetId: 'settled-' + index }))

/** A row of the selection, as picking a provider asset in its list makes it. */
const selectedRow = (id: string) =>
  queueRow({
    type: 'externalProviderAsset',
    status: 'uploaded',
    assetId: null,
    fileId: null,
    assetStatus: 'with_file',
    displayTitle: 'title of ' + id,
    externalProviderAssetId: id,
    externalProviderName: 'unsplash',
    externalProviderMetadata: { width: 800 },
    imagePreview: { url: 'https://provider.test/' + id + '.jpg' } as never,
  })

const imports = () => server.sent('POST', /\/image\/licence\/1\/external-provider$/)

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the import of the provider asset open in the detail', () => {
  // The asset the detail shows, whatever tile of the list is active.
  it('puts it into the upload queue, which imports it, and closes the detail when asked to', async () => {
    const { store, listStore, detailStore, actions } = await load()
    seedQueue(store, GLOBAL, settled(49))
    listStore.setList([provided('photo-1'), provided('photo-2')])
    listStore.setActiveByIndex(0)
    detailStore.setAsset(provided('photo-2'))
    detailStore.showDetail()

    await actions.importFromDetail(true)
    await vi.advanceTimersByTimeAsync(0)

    const row = store.getQueueItems(GLOBAL)[49]
    expect([row.type, row.externalProviderAssetId, row.externalProviderName, row.displayTitle]).toEqual([
      'externalProviderAsset',
      'photo-2',
      'unsplash',
      'title of photo-2',
    ])
    expect(imports().map((request) => JSON.parse(request.data as string))).toEqual([
      { id: 'photo-2', externalProvider: 'unsplash' },
    ])
    expect([row.status, row.assetId, row.fileId]).toEqual(['processing', 'asset-1', 'file-1'])
    // What the provider said about the asset is written into the row, as the detail holds it.
    expect(row.externalProviderMetadata).toEqual({ width: 800 })
    expect(detailStore.detail).toBe(false)
    expect(showWarning).not.toHaveBeenCalled()
  })

  it('is refused with a warning while the upload queue is full', async () => {
    const { store, listStore, detailStore, actions } = await load()
    seedQueue(store, GLOBAL, settled(50))
    listStore.setList([provided('photo-1')])
    listStore.setActiveByIndex(0)
    detailStore.setAsset(provided('photo-1'))
    detailStore.showDetail()

    await actions.importFromDetail(true)

    expect(store.getQueueTotalCount(GLOBAL)).toBe(50)
    expect(imports()).toEqual([])
    expect(showWarning).toHaveBeenCalledTimes(1)
    // And the detail stays open on what could not be imported.
    expect(detailStore.detail).toBe(true)
  })

  it('does nothing while no asset is open', async () => {
    const { store, actions } = await load()

    await actions.importFromDetail()

    expect(store.getQueue(GLOBAL)).toBeNull()
    expect(showWarning).not.toHaveBeenCalled()
  })
})

describe('the import of the selected provider assets', () => {
  it('moves a selection that fits exactly into the upload queue and empties the selection', async () => {
    const { store, actions } = await load()
    seedQueue(store, GLOBAL, settled(48))
    seedQueue(store, EDIT, [selectedRow('photo-1'), selectedRow('photo-2')])
    const selectionKeyBefore = store.getQueueFileInputKey(EDIT)

    await actions.importFromSelected()
    await vi.advanceTimersByTimeAsync(0)

    expect(store.getQueueTotalCount(GLOBAL)).toBe(50)
    const added = store.getQueueItems(GLOBAL).slice(48)
    expect(added.map((row) => [row.type, row.externalProviderAssetId, row.displayTitle, row.assetType])).toEqual([
      ['externalProviderAsset', 'photo-1', 'title of photo-1', 'image'],
      ['externalProviderAsset', 'photo-2', 'title of photo-2', 'image'],
    ])
    expect(added.map((row) => row.imagePreview?.url)).toEqual([
      'https://provider.test/photo-1.jpg',
      'https://provider.test/photo-2.jpg',
    ])
    // What the provider said about the asset comes along from the selection, as an import from the detail brings it.
    expect(added.map((row) => row.externalProviderMetadata)).toEqual([{ width: 800 }, { width: 800 }])
    expect(imports().map((request) => JSON.parse(request.data as string))).toEqual([
      { id: 'photo-1', externalProvider: 'unsplash' },
      { id: 'photo-2', externalProvider: 'unsplash' },
    ])
    expect(added.map((row) => row.status)).toEqual(['processing', 'processing'])
    expect(store.getQueueItems(EDIT)).toEqual([])
    expect(store.getQueueFileInputKey(EDIT)).toBe(selectionKeyBefore + 1)
    expect(showWarning).not.toHaveBeenCalled()
  })

  it('gives each imported row the provider metadata of its own selected row, and none to a row that had none', async () => {
    const { store, actions } = await load()
    seedQueue(store, EDIT, [
      queueRow({ ...selectedRow('photo-1'), externalProviderMetadata: { width: 800, author: 'Ann' } }),
      queueRow({ ...selectedRow('photo-2'), externalProviderMetadata: { width: 1200, tags: ['sea', 'boat'] } }),
      queueRow({ ...selectedRow('photo-3'), externalProviderMetadata: undefined as never }),
    ])

    await actions.importFromSelected()

    // Written into the row of the upload queue (the store), as an import from the detail writes them. Nothing shows
    // them there - only the panel of the selection does (`ExternalProviderAssetQueueItemReadonly.vue`) - and none is
    // sent to DAM.
    expect(
      store.getQueueItems(GLOBAL).map((row) => [row.externalProviderAssetId, row.externalProviderMetadata])
    ).toEqual([
      ['photo-1', { width: 800, author: 'Ann' }],
      ['photo-2', { width: 1200, tags: ['sea', 'boat'] }],
      ['photo-3', {}],
    ])
  })

  it('is refused with a warning when it does not fit, and the selection stays', async () => {
    const { store, actions } = await load()
    seedQueue(store, GLOBAL, settled(49))
    const selection = seedQueue(store, EDIT, [selectedRow('photo-1'), selectedRow('photo-2')])

    await actions.importFromSelected()

    expect(store.getQueueTotalCount(GLOBAL)).toBe(49)
    expect(imports()).toEqual([])
    expect(store.getQueueItems(EDIT)).toEqual(selection)
    expect(showWarning).toHaveBeenCalledTimes(1)
  })
})
