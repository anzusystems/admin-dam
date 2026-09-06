import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'

const fetchAsset = vi.fn(async (): Promise<unknown> => undefined)
const fetchAssetList = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => [])

vi.mock('@/domains/coreDam/asset/api/assetApi', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  fetchAsset: (...args: unknown[]) => fetchAsset(...(args as [])),
  fetchAssetList: (...args: unknown[]) => fetchAssetList(...args),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({}) }))
const browserHistoryReplaceUrlByRouter = vi.fn()
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  browserHistoryReplaceUrlByRouter: (...args: unknown[]) => browserHistoryReplaceUrlByRouter(...args),
  useDamCachedUsers: () => ({ fetchCachedUsers: vi.fn(), addToCachedUsers: vi.fn() }),
  useAlerts: () => ({ showWarning: vi.fn(), showErrorsDefault: vi.fn() }),
}))
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
const massEditItems = ref<{ type: string; assetId: string }[]>([])
vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({
    getQueueItems: () => massEditItems.value,
    getQueueTotalCount: () => massEditItems.value.length,
    removeByAssetId: vi.fn(),
    addByAssets: vi.fn(),
    clearQueue: vi.fn(),
  }),
}))

const listItem = (id: string) => ({
  id,
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: null,
})

const detailOf = (id: string) => ({
  id,
  createdBy: null,
  modifiedBy: null,
  keywords: [],
  authors: [],
  mainFile: null,
  mainFileSingleUse: null,
  metadata: { customData: {}, authorSuggestions: {}, keywordSuggestions: {} },
})

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useAssetListActions } = await import(
    '@/domains/coreDam/asset/components/list/composables/assetListActions'
  )
  const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const assetListStore = useAssetListStore()
  assetListStore.setList([listItem('asset-a'), listItem('asset-b')] as never)

  return {
    actions: useAssetListActions(),
    // The tiles, the table and the view around them each call the composable for themselves.
    otherInstance: useAssetListActions(),
    assetListStore,
    assetDetailStore: useAssetDetailStore(),
  }
}

// The rows a page carries say which page it is, so a page fetched twice is visible in the list.
const pageOf = (args: unknown[]) => {
  const pagination = args[1] as { value: { page: number; hasNextPage?: boolean } }
  // What the library does with the pagination object it is handed as it answers.
  pagination.value = { ...pagination.value, hasNextPage }

  return [listItem(`page-${pagination.value.page}`)]
}

let hasNextPage = true

beforeEach(() => {
  vi.clearAllMocks()
  massEditItems.value = []
  hasNextPage = true
  fetchAssetList.mockImplementation(async (...args: unknown[]) => pageOf(args))
})

describe('two detail requests at once', () => {
  it('lets the newer one answer, and the older one say nothing', async () => {
    const { actions, assetDetailStore } = await load()
    let failFirst: (reason: unknown) => void = () => undefined
    fetchAsset.mockImplementationOnce(() => new Promise((_resolve, reject) => (failFirst = reject)))
    fetchAsset.mockResolvedValue(detailOf('asset-b'))

    const first = actions.showDetail({ assetId: 'asset-a', index: 0 })
    await actions.showDetail({ assetId: 'asset-b', index: 1 })
    failFirst(new Error('gone'))
    await first

    // Held-down arrow keys and quick clicks put several of these on the wire, and they do not come back in order. The
    // catch clears the detail, so unguarded it would empty the dialog on the asset the user has moved to.
    expect(assetDetailStore.asset?.id).toBe('asset-b')
    expect(assetDetailStore.detail).toBe(true)
    expect(assetDetailStore.loader).toBe(false)
  })

  it('does not let the older one hold the five-second cache', async () => {
    const { actions, assetDetailStore } = await load()
    let finishFirst: (value: unknown) => void = () => undefined
    fetchAsset.mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
    fetchAsset.mockResolvedValue(detailOf('asset-b'))

    const first = actions.showDetail({ assetId: 'asset-a', index: 0 })
    await actions.showDetail({ assetId: 'asset-b', index: 1 })
    finishFirst(detailOf('asset-a'))
    await first

    // Were the stale answer to stamp it, the next opening of that asset would short-circuit to
    // the cache and leave the other one on screen.
    expect(assetDetailStore.lastFetchedId).not.toBe('asset-a')
  })
})

describe('two components asking at once', () => {
  it('counts the requests of every component that asks, not of one of them', async () => {
    const { actions, otherInstance, assetDetailStore } = await load()
    let failFirst: (reason: unknown) => void = () => undefined
    fetchAsset.mockImplementationOnce(() => new Promise((_resolve, reject) => (failFirst = reject)))
    fetchAsset.mockResolvedValue(detailOf('asset-b'))

    // A click comes from the tiles, the arrow key from the view around them - two instances, one
    // detail store between them.
    const first = actions.showDetail({ assetId: 'asset-a', index: 0 })
    await otherInstance.showDetail({ assetId: 'asset-b', index: 1 })
    failFirst(new Error('gone'))
    await first

    expect(assetDetailStore.asset?.id).toBe('asset-b')
    expect(assetDetailStore.detail).toBe(true)
  })
})

describe('another component writing the same detail', () => {
  it('takes the answer away from a list request that is still running', async () => {
    const { actions, assetDetailStore } = await load()
    let finish: (value: unknown) => void = () => undefined
    fetchAsset.mockImplementation(() => new Promise((resolve) => (finish = resolve)))

    const running = actions.showDetail({ assetId: 'asset-a', index: 0 })
    // What the queue dialog's own edit button does: it fetches for itself and writes to this same store, so the count
    // has to live in the store rather than in the list composable.
    assetDetailStore.startDetailRequest()
    finish(detailOf('asset-a'))
    await running

    expect(assetDetailStore.asset).toBeNull()
  })
})

describe('a detail the user has walked away from', () => {
  it('says nothing when it finally fails', async () => {
    const { actions, assetDetailStore } = await load()
    let fail: (reason: unknown) => void = () => undefined
    fetchAsset.mockImplementation(() => new Promise((_resolve, reject) => (fail = reject)))

    const running = actions.showDetail({ assetId: 'asset-a', index: 0 })
    // Leaving the list unmounts it and resets the detail; the request is still on the wire.
    assetDetailStore.reset()
    fail(new Error('gone'))
    await running

    // `reset()` abandons it: were it still counted as the current request, its failure would show its error and send
    // the address back to the list from wherever the user had gone.
    expect(assetDetailStore.detail).toBe(false)
    expect(browserHistoryReplaceUrlByRouter).toHaveBeenCalledTimes(1)
  })
})

describe('a detail the user closed', () => {
  it('says nothing when it finally fails', async () => {
    const { actions, assetDetailStore } = await load()
    let fail: (reason: unknown) => void = () => undefined
    fetchAsset.mockImplementation(() => new Promise((_resolve, reject) => (fail = reject)))

    const running = actions.showDetail({ assetId: 'asset-a', index: 0 })
    // The dialog's own close button, which is not a new request taking this one's place.
    assetDetailStore.hideDetail()
    fail(new Error('gone'))
    await running

    expect(browserHistoryReplaceUrlByRouter).toHaveBeenCalledTimes(1)
    expect(assetDetailStore.loader).toBe(false)
  })

  it('lets a fetch that is still running finish', async () => {
    const { actions, assetDetailStore } = await load()
    let finish: (value: unknown) => void = () => undefined
    fetchAsset.mockImplementation(() => new Promise((resolve) => (finish = resolve)))

    const panel = actions.onItemClick({ assetId: 'asset-a', index: 0 })
    assetDetailStore.hideDetail()
    finish(detailOf('asset-a'))
    await panel

    // Closing the dialog is not leaving the detail: the panel on the right renders the same asset, and cancelling the
    // fetch left it on whatever had been there before.
    expect(assetDetailStore.asset?.id).toBe('asset-a')
  })

  it('does not keep the panel answer of a double click whose dialog failed', async () => {
    const { actions, assetDetailStore } = await load()
    let finishPanel: (value: unknown) => void = () => undefined
    let failDialog: (reason: unknown) => void = () => undefined
    fetchAsset.mockImplementationOnce(() => new Promise((resolve) => (finishPanel = resolve)))
    fetchAsset.mockImplementationOnce(() => new Promise((_resolve, reject) => (failDialog = reject)))

    const panel = actions.onItemClick({ assetId: 'asset-a', index: 0 })
    const dialog = actions.showDetail({ assetId: 'asset-a', index: 0 })
    finishPanel(detailOf('asset-a'))
    failDialog(new Error('gone'))
    await Promise.all([panel, dialog])

    // Both were for the same asset, and the newest of them is the one that answers: an empty panel and an error is
    // the truth of it, where the panel's own answer would look like a detail that had loaded.
    expect(assetDetailStore.asset).toBeNull()
  })

  it('leaves no asset behind when the dialog fetch of a double click fails', async () => {
    const { actions, assetDetailStore } = await load()
    fetchAsset.mockResolvedValue(detailOf('asset-b'))
    // Something the user opened a moment ago, still on screen behind the list.
    await actions.onItemClick({ assetId: 'asset-b', index: 1 })

    const failures: ((reason: unknown) => void)[] = []
    fetchAsset.mockImplementation(() => new Promise((_resolve, reject) => failures.push(reject)))
    // A double click fires both: the click opens the panel, the second click the dialog.
    const panel = actions.onItemClick({ assetId: 'asset-a', index: 0 })
    const dialog = actions.showDetail({ assetId: 'asset-a', index: 0 })
    failures.forEach((fail) => fail(new Error('gone')))
    await Promise.all([panel, dialog])

    // The panel request is not the current one any more, so its own cleanup never runs; the dialog one clears the
    // detail rather than only closing it.
    expect(assetDetailStore.asset).toBeNull()
  })

  it('says nothing when the list it belonged to is gone', async () => {
    const { actions, assetDetailStore } = await load()
    let fail: (reason: unknown) => void = () => undefined
    fetchAsset.mockImplementation(() => new Promise((_resolve, reject) => (fail = reject)))

    const running = actions.showDetail({ assetId: 'asset-a', index: 0 })
    actions.listUnmounted()
    fail(new Error('gone'))
    await running

    // Leaving the page is not closing the dialog, and it used to leave the request answering.
    expect(browserHistoryReplaceUrlByRouter).toHaveBeenCalledTimes(1)
    expect(assetDetailStore.detail).toBe(true)
  })
})

describe('the detail loader', () => {
  it('comes down even when the list is replaced while the fetch is in flight', async () => {
    const { actions, assetListStore, assetDetailStore } = await load()
    let finish: (value: unknown) => void = () => undefined
    fetchAsset.mockImplementation(() => new Promise((resolve) => (finish = resolve)))

    const running = actions.showDetail({ assetId: 'asset-a', index: 0 })
    // The reset filter button does exactly this underneath the request.
    assetListStore.resetList()
    finish(detailOf('asset-a'))
    await running

    // The sidebar renders a spinner and hides its content while this is true, so a loader nobody takes down is a
    // panel that spins for the rest of the session.
    expect(assetDetailStore.loader).toBe(false)
  })
})

describe('a page that arrives after the filter has changed', () => {
  it('is not appended to the list that replaced it', async () => {
    const { actions, assetListStore } = await load()
    let finishOldPage: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishOldPage = resolve)))

    const scrolling = actions.fetchNextPage()
    // The filter changes underneath it, and the list starts again from page one.
    await actions.fetchAssetList()
    finishOldPage([listItem('stale')])
    await scrolling

    // Its rows belong to a filter nobody is looking at any more.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1'])
  })

  it('asks again for a page that failed rather than skipping it', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    fetchAssetList.mockRejectedValueOnce(new Error('the asset service is down'))

    await actions.fetchNextPage()
    await actions.fetchNextPage()

    // The counter was raised before the request and never put back, so the next scroll used to ask
    // for the one after it and the failed page was gone for good.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })

  it('serves one scroll at a time, and does not forget the one it postponed', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let finishPageTwo: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishPageTwo = resolve)))

    const two = actions.fetchNextPage()
    // The sentinel stays in view for the whole request, so this arrives before the first is done.
    await actions.fetchNextPage()
    expect(fetchAssetList).toHaveBeenCalledTimes(2)
    finishPageTwo([listItem('page-2')])
    await two

    // Two of them running at once cannot be put back in order: they append in whatever order they answer, and one
    // that fails while the other has moved the counter past it is gone for good.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2', 'page-3'])
  })

  it('retries a page that failed, and asks for no other', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let failPageTwo: (reason: unknown) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((_resolve, reject) => (failPageTwo = reject)))

    const two = actions.fetchNextPage()
    await actions.fetchNextPage()
    failPageTwo(new Error('the asset service is down'))
    await two

    // The postponed scroll asks for the page that failed, not for the one after it.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })

  it('serves the scroll that arrived while the list that replaced it was still loading', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let finishPageTwo: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishPageTwo = resolve)))

    const two = actions.fetchNextPage()
    // The filter changes, and the user scrolls again while the new first page is still loading.
    let finishNewFirstPage: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishNewFirstPage = resolve)))
    const newList = actions.fetchAssetList()
    await actions.fetchNextPage()
    finishPageTwo([listItem('stale-page-2')])
    await two
    finishNewFirstPage([listItem('page-1')])
    await newList

    // Serving that scroll when the old request finished would have fetched the second page of the new filter before
    // its first, and the first would then have wiped it with the counter left standing at two.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })

  it('waits for the newest list, not the first one that answers', async () => {
    const { actions, assetListStore } = await load()
    let finishFirst: (value: unknown[]) => void = () => undefined
    let finishSecond: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))

    const older = actions.fetchAssetList()
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishSecond = resolve)))
    const newer = actions.fetchAssetList()
    await actions.fetchNextPage()
    // The older of the two answers first; its list has already been replaced.
    finishFirst([listItem('stale')])
    await older
    finishSecond([listItem('page-1')])
    await newer

    // Letting the older one declare the loading over serves the scroll before the newer list has arrived, and the
    // newer list then wipes the page it fetched.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })

  it('does not let an older list throw away a scroll made of the newer one', async () => {
    const { actions, assetListStore } = await load()
    let failOlder: (reason: unknown) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((_resolve, reject) => (failOlder = reject)))

    const older = actions.fetchAssetList()
    let finishNewer: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishNewer = resolve)))
    const newer = actions.fetchAssetList()
    await actions.fetchNextPage()
    failOlder(new Error('gone'))
    await older
    finishNewer([listItem('page-1')])
    await newer

    // The scroll belongs to the list that is still loading, not to the one that gave up.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })

  it('drops a postponed scroll when the list it was waiting for could not load', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let failNewList: (reason: unknown) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((_resolve, reject) => (failNewList = reject)))

    const newList = actions.fetchAssetList()
    await actions.fetchNextPage()
    failNewList(new Error('the asset service is down'))
    await newList

    // The rows on screen belong to the list this one was meant to replace; its page two is not theirs.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1'])
  })

  it('drops a postponed scroll once the answer says there is no next page', async () => {
    const { actions } = await load()
    await actions.fetchAssetList()
    let finishPageTwo: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishPageTwo = resolve
        })
    )

    const two = actions.fetchNextPage()
    await actions.fetchNextPage()
    // The library writes this onto the pagination object it was handed, as the answer comes back.
    const pagination = fetchAssetList.mock.calls.at(-1)?.[1] as { value: { hasNextPage?: boolean } }
    pagination.value = { ...pagination.value, hasNextPage: false }
    finishPageTwo([listItem('page-2')])
    await two

    // Two requests: the list and its page two, and no ask for a page the answer says is not there.
    expect(fetchAssetList).toHaveBeenCalledTimes(2)
  })

  it('drops a scroll postponed in the list that a filter change replaced', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let finishPageTwo: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishPageTwo = resolve)))

    const two = actions.fetchNextPage()
    // Both of these belong to the list that is about to be replaced.
    await actions.fetchNextPage()
    await actions.fetchAssetList()
    finishPageTwo([listItem('stale-page-2')])
    await two

    // Three requests: the first list, its page two, the list that replaced it - and no fourth.
    expect(fetchAssetList).toHaveBeenCalledTimes(3)
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1'])
  })

  it('does not put the counter of the list that replaced it back either', async () => {
    const { actions, assetListStore } = await load()
    let failOldPage: (reason: unknown) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((_resolve, reject) => (failOldPage = reject)))

    const scrolling = actions.fetchNextPage()
    await actions.fetchAssetList()
    // The new list is scrolled to its own second page before the old request gives up.
    await actions.fetchNextPage()
    failOldPage(new Error('gone'))
    await scrolling
    await actions.fetchNextPage()

    // Rolling back a counter this request did not raise makes the next scroll ask for a page the list already has,
    // and the same rows arrive twice.
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2', 'page-3'])
  })
})

describe('two filter changes at once', () => {
  it('leaves the newer list on screen, not the one that answered last', async () => {
    const { actions, assetListStore } = await load()
    let finishOld: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishOld = resolve)))

    const older = actions.fetchAssetList()
    await actions.fetchAssetList()
    finishOld([listItem('stale')])
    await older

    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1'])
  })
})

describe('stepping to the next asset', () => {
  it('does nothing when the list it was stepping through is gone', async () => {
    const { actions, assetListStore, assetDetailStore } = await load()
    fetchAsset.mockResolvedValue(detailOf('asset-b'))
    assetListStore.setActiveByIndex(0)
    assetListStore.resetList()

    // The active index outlives the list it points into, so this used to throw on `undefined.asset` with the spinner
    // already up and no `finally` yet to take it down.
    await actions.nextItem()
    await actions.prevItem()

    expect(assetDetailStore.loader).toBe(false)
    expect(fetchAsset).not.toHaveBeenCalled()
  })
})

describe('the tiles of the mass edit selection', () => {
  it('follow the queue, whatever took the item out of it', async () => {
    const { actions, assetListStore } = await load()
    void actions
    massEditItems.value = [{ type: 'asset', assetId: 'asset-a' }]
    await nextTick()
    expect(assetListStore.list.map((row) => row.selected)).toEqual([true, false])

    // What the cancel button in the mass edit dialog does, with no way to reach the list itself.
    massEditItems.value = []
    await nextTick()

    // Every action that put an asset in the queue also set the flag by hand, and the ones that take it back out left
    // the tile highlighted for an asset nothing was going to save.
    expect(assetListStore.list.map((row) => row.selected)).toEqual([false, false])
  })
})

describe('a next page left over from a list that has been replaced', () => {
  it('does not hold the new list back until it answers', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let finishStalePage: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishStalePage = resolve)))
    const stalePage = actions.fetchNextPage()

    await actions.fetchAssetList()
    // The new list's own scroll, with the old request still on the wire and nothing aborting it.
    let finishNewPage: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishNewPage = resolve)))
    const newPage = actions.fetchNextPage()

    // Made to wait for the old request, the new list would not scroll until that one answered - and nothing aborts
    // it, so that is its whole timeout.
    expect(fetchAssetList).toHaveBeenCalledTimes(4)
    finishStalePage([listItem('stale')])
    await stalePage
    // And the old one finishing must not hand the flag of the running one away: a scroll starting
    // now would append beside it, in whatever order the two answered.
    await actions.fetchNextPage()
    expect(fetchAssetList).toHaveBeenCalledTimes(4)
    // Nor take the spinner down under it, which leaves the list looking idle while it loads.
    expect(assetListStore.loader.soft).toBe(true)

    finishNewPage([listItem('page-2')])
    await newPage
    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2', 'page-3'])
    expect(assetListStore.loader.soft).toBe(false)
  })
})

describe('a next page that answers after the filter changed', () => {
  it('takes its own spinner down, because nothing else will', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let finishStalePage: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishStalePage = resolve)))
    const stalePage = actions.fetchNextPage()

    // The filter changes and nothing scrolls the new list, so no newer request owns the spinner.
    await actions.fetchAssetList()
    finishStalePage([listItem('stale')])
    await stalePage

    // `fetchAssetList` raises `hard` and never lowers `soft`, so leaving it to a newer next-page request that never
    // comes is a spinner at the end of the list for the rest of the session.
    expect(assetListStore.loader.soft).toBe(false)
  })
})

describe('a page counter written by a request that no longer owns the list', () => {
  it('does not tell the new list there is nothing more to load', async () => {
    const { actions, assetListStore } = await load()
    await actions.fetchAssetList()
    let finishStalePage: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishStalePage = resolve)))
    const stalePage = actions.fetchNextPage()
    const stalePagination = fetchAssetList.mock.calls.at(-1)?.[1] as { value: { hasNextPage?: boolean } }

    let finishNewList: (value: unknown[]) => void = () => undefined
    fetchAssetList.mockImplementationOnce(() => new Promise((resolve) => (finishNewList = resolve)))
    const newList = actions.fetchAssetList()
    await actions.fetchNextPage()
    finishNewList([listItem('page-1')])
    await newList
    // The library writes this onto whatever pagination object it was handed, before it returns - so a request that
    // has been replaced would otherwise stop the new list scrolling.
    stalePagination.value = { ...stalePagination.value, hasNextPage: false }
    finishStalePage([listItem('stale')])
    await stalePage

    expect(assetListStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })
})
