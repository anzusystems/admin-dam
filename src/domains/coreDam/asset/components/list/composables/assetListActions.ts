import {
  DamAssetType,
  SortOrder,
  UploadQueueItemType,
  arrayItemToggle,
  browserHistoryReplaceUrlByRouter,
  isNull,
  isUndefined,
  useAlerts,
  useDamCachedUsers,
  useFilterHelpers,
  usePageNavigation,
  usePagination,
} from '@anzusystems/common-admin'
import type { AssetSearchListItemDto, DamAssetTypeType, DocId, Pagination } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { readonly, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'

import { fetchAsset as apiFetchAsset, fetchAssetList as apiFetchAssetList } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailFileChange } from '@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetListFilter } from '@/domains/coreDam/asset/filter/AssetFilter'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import type { AssetListItem } from '@/domains/coreDam/asset/store/assetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { useBetaTestFeatures } from '@/shared/utils/BetaTestFeaturesService'
import { anotherDialogOrMenuIsOpen, keyboardEventTargetIsAnyFormElement } from '@/shared/utils/event'

const DO_NOT_RE_FETCH_SAME_ASSET_DETAIL_TIME = 5 * 1000
export const SORT_BY_SCORE_DATE = 'score_date'
export const SORT_BY_SCORE_BEST = 'score_best'
/** Marks the dialog of the detail among the open ones: every other one is open over it. */
export const ASSET_DETAIL_DIALOG_CLASS = 'dam-image-detail-dialog'

const { showWarning, showErrorsDefault } = useAlerts()
const { customDialog } = useMainWrapper()

const { filterData, filterConfig } = useAssetListFilter()
const { pagination } = usePagination(SORT_BY_SCORE_DATE, SortOrder.Desc, { rowsPerPage: 25 })

export const customSortOptions = [
  {
    id: 3,
    titleT: 'common.system.datatable.ordering.mostRelevant',
    sortBy: { key: SORT_BY_SCORE_BEST, order: SortOrder.Desc },
  },
  {
    id: 1,
    titleT: 'common.system.datatable.ordering.mostRecent',
    sortBy: { key: SORT_BY_SCORE_DATE, order: SortOrder.Desc },
  },
  {
    id: 2,
    titleT: 'common.system.datatable.ordering.oldest',
    sortBy: { key: SORT_BY_SCORE_DATE, order: SortOrder.Asc },
  },
]

const filterIsTouched = ref(false)

/* Bumped whenever the list starts again from page one, so a request already on the wire can tell
 * that its rows and its counter belong to a list nobody is looking at. From one, so that the
 * 'nothing postponed' marker below cannot pass for a generation. */
let listGeneration = 1

/* The generation whose next page is on the wire, or 0 for none - one at a time within a generation,
 * because two of them append in whatever order they answer and a page that fails while the other
 * moved the counter past it is gone. One left over from a replaced list holds nothing back. */
let nextPageInFlightGeneration = 0
let firstPageInFlight = false
/* The generation the postponed scroll was asked in, or 0 for none: one asked of a list since
 * replaced is not the same ask, and one served too early fetches page two before page one. */
let nextPageAskedInGeneration = 0

export function useAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const router = useRouter()
  const { onPage } = usePageNavigation()
  const assetListStore = useAssetListStore()
  const assetDetailStore = useAssetDetailStore()
  const uploadQueuesStore = useUploadQueuesStore()
  const { readAfterFileChange } = useAssetDetailFileChange()

  const { list, loader, activeItemIndex } = storeToRefs(assetListStore)
  const { resetFilter } = useFilterHelpers(filterData, filterConfig, {
    populateUrlParams: false,
    storeFiltersLocalStorage: false,
  })
  const { currentAssetLicenceId } = useCurrentAssetLicence()
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()
  const { maxSelectedItems } = useBetaTestFeatures()
  const showMetaIcons = ref(true)

  const toggleShowMetaIcons = () => {
    showMetaIcons.value = !showMetaIcons.value
  }

  const checkQuickDetailReFetch = (assetId: DocId) => {
    return (
      // The detail has to hold that asset still: the edit of a queue row writes another without the stamp.
      assetDetailStore.asset?.id === assetId &&
      assetDetailStore.lastFetchedId === assetId &&
      Date.now() - assetDetailStore.lastFetched <= DO_NOT_RE_FETCH_SAME_ASSET_DETAIL_TIME
    )
  }

  const fetchAsset = async (assetId: DocId, detailRequest: number) => {
    /* Stamped only after it succeeded, and only by the current request: a failure held the cache for
     * five seconds, and a stale answer left the next opening short-circuiting to another asset. */
    const asset = await apiFetchAsset(assetId)
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.updateLastFetched(assetId)

    return asset
  }

  /* With the detail closed the panel beside the list holds what was typed into it, and the read of an asset replaces
   * it: asked about first. Not when nothing is read, which is so for the asset the panel holds, read a moment ago:
   * its tile and its pencil leave what was typed where it is. While the question is open every such step is one more
   * ask, and is told to stay. */
  const readReplacesUnsavedOfPanel = (assetId: DocId) =>
    assetDetailStore.panelHoldsUnsavedMetadata &&
    (assetDetailStore.leaveUnsavedQuestion || !checkQuickDetailReFetch(assetId))

  /* Asks, and once told to leave answers where the asset is by then: the list can be read anew under the open
   * question, and the index the click brought is then another asset's, or nobody's. `null` to stay where it is. */
  const leaveUnsavedFor = async <T extends { assetId: DocId; index: number }>(clicked: T) => {
    if (!(await assetDetailStore.askToLeaveUnsaved())) return null
    // At the place it was clicked while its asset is still there: listed twice, it would be found at its first place.
    if (assetListStore.list[clicked.index]?.asset.id === clicked.assetId) return clicked
    const index = assetListStore.list.findIndex((item) => item.asset.id === clicked.assetId)

    return index < 0 ? null : { ...clicked, index }
  }

  /** The asset the panel beside the list shows: none while it is behind its loader, or holds none. */
  const shownInPanel = () => (assetDetailStore.loader ? null : (assetDetailStore.asset?.id ?? null))

  /**
   * The asset `nextItem` (1) or `prevItem` (-1) goes to: the neighbour of the active one, none at an end of the list.
   * With no tile active the next one is the first, and there is no previous one.
   */
  const neighbourOfActive = (step: 1 | -1): AssetListItem | undefined =>
    assetListStore.list[(assetListStore.activeItemIndex ?? -1) + step]

  /* The library replaces the value of the ref it is handed before it returns, so each request gets
   * its own and only the answer that still owns the list is copied back - a stale one told the new
   * list there was nothing more to load. */
  const paginationForRequest = () => ref({ ...pagination.value })
  const acceptPaginationAnswer = (answered: Ref<Pagination>) => {
    pagination.value.hasNextPage = answered.value.hasNextPage
    pagination.value.currentViewCount = answered.value.currentViewCount
  }

  const fetchAssetList = async () => {
    pagination.value.page = 1
    const generation = ++listGeneration
    firstPageInFlight = true
    try {
      assetListStore.showLoader('hard')
      const answered = paginationForRequest()
      const firstPage = await apiFetchAssetList(currentAssetLicenceId.value, answered, filterData, filterConfig)
      // Two filter changes answer in whatever order they like; the older one used to win.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        assetListStore.setList(firstPage, uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT), shownInPanel())
        // And the detail or the panel that holds one of them with its main file still on its way.
        firstPage.forEach((asset) => assetDetailStore.mainFileOfRead(asset))
      }
    } catch (error) {
      // And the scroll made while this was loading: its page two would land on a page one that is not there.
      if (generation === listGeneration) nextPageAskedInGeneration = 0
      showErrorsDefault(error)
    } finally {
      if (generation === listGeneration) {
        firstPageInFlight = false
        // Only the newest: an older answer taking it down shows the rows from before both changes.
        assetListStore.hideLoader('hard')
      }
      await servePostponedScroll()
    }
  }

  const resetAssetList = async () => {
    assetListStore.resetList()
    resetFilter(pagination, fetchAssetList)
  }

  /* Kept waiting while this generation still has something on the wire - whatever finishes last
   * serves it - and dropped when the list it was asked of is gone, or an answer since said there is
   * no next page. */
  const servePostponedScroll = async () => {
    // First: while a request is out, `hasNextPage` is still the previous answer's.
    if (firstPageInFlight || nextPageInFlightGeneration === listGeneration) return
    if (nextPageAskedInGeneration !== listGeneration || pagination.value.hasNextPage === false) {
      nextPageAskedInGeneration = 0

      return
    }
    nextPageAskedInGeneration = 0
    await fetchNextPage()
  }

  const fetchNextPage = async () => {
    const { maxAssetListItems } = useBetaTestFeatures()
    if (assetListStore.list.length >= maxAssetListItems.value) {
      showWarning('Maximum listing limit reached, please update your filter for better result.')
      return
    }
    if (nextPageInFlightGeneration === listGeneration || firstPageInFlight) {
      nextPageAskedInGeneration = listGeneration

      return
    }
    const requestedPage = pagination.value.page + 1
    const generation = listGeneration
    pagination.value.page = requestedPage
    nextPageInFlightGeneration = generation
    try {
      assetListStore.showLoader('soft')
      const answered = paginationForRequest()
      const nextPage = await apiFetchAssetList(currentAssetLicenceId.value, answered, filterData, filterConfig)
      // Only onto the list that asked for it, not the one a filter change has put in its place.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        assetListStore.appendList(nextPage, uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT), shownInPanel())
        nextPage.forEach((asset) => assetDetailStore.mainFileOfRead(asset))
      }
    } catch (error) {
      // Or the failed page is skipped by the next scroll.
      if (generation === listGeneration) {
        pagination.value.page = requestedPage - 1
      }
      showErrorsDefault(error)
    } finally {
      /* Tied to owning the flag, not to the generation: only a newer next-page request takes it and
       * it raised the spinner itself, while a generation that moved on without one leaves nobody to
       * lower `soft` - `fetchAssetList` raises only `hard`. */
      if (nextPageInFlightGeneration === generation) {
        assetListStore.hideLoader('soft')
        nextPageInFlightGeneration = 0
      }
      await servePostponedScroll()
    }
  }

  const setTypeAndFetch = async (type: null | DamAssetTypeType = null) => {
    if (isNull(type)) {
      filterData.type = []
      filterData.inPodcast = null
      await fetchAssetList()
      return
    }
    arrayItemToggle(filterData.type as DamAssetTypeType[], type)
    if (!(filterData.type as DamAssetTypeType[]).includes(DamAssetType.Audio) && filterData.inPodcast) {
      filterData.inPodcast = null
    }
    await fetchAssetList()
  }

  const togglePodcastAndFetch = async () => {
    if (filterData.inPodcast) {
      filterData.inPodcast = null
      await fetchAssetList()
      return
    }
    filterData.inPodcast = true
    filterData.type = [DamAssetType.Audio]
    await fetchAssetList()
  }

  const filterTouch = () => {
    filterIsTouched.value = true
  }
  const filterUnTouch = () => {
    filterIsTouched.value = false
  }

  const showDetail = async (clicked: { assetId: DocId; index: number }) => {
    const data = readReplacesUnsavedOfPanel(clicked.assetId) ? await leaveUnsavedFor(clicked) : clicked
    if (isNull(data)) return
    assetDetailStore.setView('list')
    assetListStore.keyboardNavigationEnable()
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    assetDetailStore.showDetail()
    const detailRequest = assetDetailStore.startDetailRequest()
    browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets/[id]', params: { id: data.assetId } })
    if (checkQuickDetailReFetch(data.assetId)) {
      assetDetailStore.hideLoader()
      return
    }
    // The list comes from an index that lags: the asset can be gone by the time it is clicked.
    try {
      const res = await fetchAsset(data.assetId, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
      addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /* Cleared, not merely closed: the dialog renders the loader or the asset and nothing else,
       * and the panel on the right renders that same asset - the one before it would be left there
       * under a working Save button. */
      assetDetailStore.reset()
      // The address was changed to this asset before the request, so put it back while the user is still here.
      if (!dialogWasOpen) return
      if (!onPage()) return
      browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  // The whole of it, behind the loader: what the read of the detail is while nothing typed into it waits to be saved.
  const readHeldAssetWhole = async () => {
    const held = assetDetailStore.asset
    if (isNull(held)) return
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest()
    try {
      const res = await fetchAsset(held.id, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
      addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      // Called from the dialog and the sidebar alike, so it has to undo both.
      assetDetailStore.reset()
      if (!onPage()) return
      browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /* Reads again the asset the detail holds, in the dialog and in the panel beside the list alike: the address of its
   * file has changed, or another of its files is the main one, or the server has processed it (`byServer`). The
   * active tile can be of another asset - the detail of a queue row is not of the list. */
  const refreshActiveItem = (byServer = false) => readAfterFileChange(readHeldAssetWhole, byServer)

  const onItemClick = async (clicked: { assetId: DocId; index: number }) => {
    const data = readReplacesUnsavedOfPanel(clicked.assetId) ? await leaveUnsavedFor(clicked) : clicked
    if (isNull(data)) return
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest()
    if (sidebarRight) sidebarRight.value = true
    if (checkQuickDetailReFetch(data.assetId)) {
      assetDetailStore.hideLoader()
      return
    }
    try {
      const res = await fetchAsset(data.assetId, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
      addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      // The sidebar keeps its last asset, and would show it under the newly selected one.
      assetDetailStore.reset()
      if (!onPage()) return
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /* The highlight follows the queue instead of being kept in step by hand: cancel and delete in the mass-edit dialog
   * cannot reach the list, and left tiles highlighted for assets nothing was going to save. */
  watch(
    () =>
      uploadQueuesStore
        .getQueueItems(QUEUE_ID_MASS_EDIT)
        // By type as well, the same rule `setList` applies.
        .filter((item) => item.type === UploadQueueItemType.Asset)
        .map((item) => item.assetId),
    (assetIds) => {
      assetListStore.setSelectedByIds(assetIds.filter((assetId) => !isNull(assetId)) as DocId[])
    }
  )

  const toggleSelected = (data: { assetId: DocId; index: number }) => {
    if (assetListStore.list[data.index].selected) {
      uploadQueuesStore.removeByAssetId(QUEUE_ID_MASS_EDIT, data.assetId)
      assetListStore.toggleSelectedByIndex(data.index)
      return
    }
    if (uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT) >= maxSelectedItems.value) {
      showWarning('Max limit for multiselect (' + maxSelectedItems.value + ') reached.', 5)
      return
    }
    uploadQueuesStore.addByAssets(QUEUE_ID_MASS_EDIT, [assetListStore.list[data.index].asset])
    assetListStore.toggleSelectedByIndex(data.index)
  }

  const selectMultiple = (data: { assetId: DocId; index: number }) => {
    let activeIndex = 0
    if (!isNull(assetListStore.activeItemIndex)) {
      activeIndex = assetListStore.activeItemIndex
    }
    if (activeIndex === data.index) return
    assetListStore.clearSelected()
    uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)

    let selecting: AssetSearchListItemDto[] = []
    if (activeIndex > data.index) {
      selecting = assetListStore.list.slice(data.index, activeIndex + 1).map((item) => {
        return item.asset
      })
    } else if (activeIndex < data.index) {
      selecting = assetListStore.list.slice(activeIndex, data.index + 1).map((item) => {
        return item.asset
      })
    }
    const selectedQueueTotalCount = uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT)
    // Reaching the limit exactly cuts nothing, so it is not worth a warning.
    if (selectedQueueTotalCount + selecting.length > maxSelectedItems.value) {
      showWarning('Max limit for multiselect (' + maxSelectedItems.value + ') reached.', 5)
      const reduceCount = maxSelectedItems.value - selectedQueueTotalCount
      if (reduceCount < 1) return
      selecting = selecting.slice(0, reduceCount)
    }
    if (selecting.length > 0) {
      uploadQueuesStore.addByAssets(QUEUE_ID_MASS_EDIT, selecting)
      assetListStore.toggleSelectedByIds(
        selecting.map((item) => {
          return item.id
        })
      )
    }
  }

  const nextItem = async () => {
    // Found first: at the end of the list there is nowhere to go, so nothing to ask about, to show or to read.
    const target = neighbourOfActive(1)
    if (isUndefined(target)) return
    // The read of the next asset replaces what the detail holds: metadata that were not saved go only when told to.
    if (assetDetailStore.showsUnsavedMetadata && !(await assetDetailStore.askToLeaveUnsaved())) return
    if (readReplacesUnsavedOfPanel(target.asset.id) && !(await assetDetailStore.askToLeaveUnsaved())) return
    assetListStore.setActiveNext()
    if (isNull(assetListStore.activeItemIndex)) return
    // Before the loader goes up: the active index outlives the list, and this threw with it up.
    const nextAsset = assetListStore.list[assetListStore.activeItemIndex]
    if (isUndefined(nextAsset)) return
    assetDetailStore.showLoader()
    const newAssetId = nextAsset.asset.id
    const detailRequest = assetDetailStore.startDetailRequest()
    // The address is of the open detail: with none open the list is walked, and its address stays.
    if (assetDetailStore.detail) {
      browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets/[id]', params: { id: newAssetId } })
    }
    if (checkQuickDetailReFetch(newAssetId)) {
      assetDetailStore.hideLoader()
      return
    }
    try {
      const res = await fetchAsset(newAssetId, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /* Cleared, not merely closed: the dialog renders the loader or the asset and nothing else,
       * and the panel on the right renders that same asset - the one before it would be left there
       * under a working Save button. */
      assetDetailStore.reset()
      if (!onPage()) return
      // The address was changed to this asset only for an open detail: put back while the user is still here.
      if (dialogWasOpen) browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const prevItem = async () => {
    // The same as `nextItem`: nowhere to go from the first one, and asked first.
    const target = neighbourOfActive(-1)
    if (isUndefined(target)) return
    if (assetDetailStore.showsUnsavedMetadata && !(await assetDetailStore.askToLeaveUnsaved())) return
    if (readReplacesUnsavedOfPanel(target.asset.id) && !(await assetDetailStore.askToLeaveUnsaved())) return
    assetListStore.setActivePrev()
    if (isNull(assetListStore.activeItemIndex)) return
    // The same as `nextItem`: the index outlives the list it points into.
    const prevAsset = assetListStore.list[assetListStore.activeItemIndex]
    if (isUndefined(prevAsset)) return
    assetDetailStore.showLoader()
    const newAssetId = prevAsset.asset.id
    const detailRequest = assetDetailStore.startDetailRequest()
    if (assetDetailStore.detail) {
      browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets/[id]', params: { id: newAssetId } })
    }
    if (checkQuickDetailReFetch(newAssetId)) {
      assetDetailStore.hideLoader()
      return
    }
    try {
      const res = await fetchAsset(newAssetId, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /* Cleared, not merely closed: the dialog renders the loader or the asset and nothing else,
       * and the panel on the right renders that same asset - the one before it would be left there
       * under a working Save button. */
      assetDetailStore.reset()
      if (!onPage()) return
      // The same as `nextItem`: the address was changed only for an open detail.
      if (dialogWasOpen) browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const listMounted = async () => {
    uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
    // Not `resetList`, which keeps the asset of the active tile for the list it reads next: the page starts with none.
    assetListStore.reset()
    await fetchAssetList()
    assetListStore.keyboardNavigationEnable()
  }

  const listUnmounted = () => {
    assetListStore.keyboardNavigationDisable()
    /* The list is going, and its detail with it: one it asked for must not answer onto whatever replaces it, and a
     * question left open has no page to draw it - it would wait for ever and tell the next ask to stay. Nor do
     * metadata that were not saved stay behind: the licence dialog is drawn on other pages too, and would ask about
     * them where nothing draws the question. */
    assetDetailStore.reset()
  }

  /* The keys are heard on the whole window, so also with a dialog or a menu open over the detail. The read of the
   * next asset puts the detail behind its loader, and what is open over it is unmounted with it: a form half filled
   * in is gone. */
  const detailIsUnderDialogOrMenu = () =>
    assetDetailStore.detail && anotherDialogOrMenuIsOpen('.' + ASSET_DETAIL_DIALOG_CLASS)

  /* A queue drawn over the whole page - the upload, the mass edit - covers the list: the keys would walk tiles nobody
   * sees and read their assets into the panel. The queue turns them off itself, and the detail of one of its rows
   * turns them on again as it closes, or fails to open. */
  const listIsUnderQueue = () => customDialog.value

  /* A detail opened from elsewhere than the list - the edit of a queue row, an asset just created - is of no tile:
   * the keys would read the neighbour of whatever tile is active into it. */
  const detailIsNotOfList = () => assetDetailStore.detail && assetDetailStore.view !== 'list'

  const onArrowRight = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !assetListStore.keyboardNavigation) return
    if (listIsUnderQueue() || detailIsNotOfList() || detailIsUnderDialogOrMenu()) return
    await nextItem()
  }

  const onArrowLeft = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !assetListStore.keyboardNavigation) return
    if (listIsUnderQueue() || detailIsNotOfList() || detailIsUnderDialogOrMenu()) return
    await prevItem()
  }

  return {
    showMetaIcons: readonly(showMetaIcons),
    toggleShowMetaIcons,
    activeItemIndex,
    loader,
    items: list,
    pagination,
    filterData,
    filterConfig,
    fetchAssetList,
    resetAssetList,
    fetchNextPage,
    setTypeAndFetch,
    togglePodcastAndFetch,
    toggleSelected,
    selectMultiple,
    filterIsTouched: readonly(filterIsTouched),
    filterTouch,
    filterUnTouch,
    listMounted,
    listUnmounted,
    showDetail,
    refreshActiveItem,
    onItemClick,
    prevItem,
    nextItem,
    neighbourOfActive,
    onArrowRight,
    onArrowLeft,
  }
}
