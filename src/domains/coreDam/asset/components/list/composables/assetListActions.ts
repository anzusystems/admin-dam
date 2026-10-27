import {
  DamAssetStatus,
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
import { useWhileOnPage } from '@/domains/system/composables/whileOnPage'
import { useBetaTestFeatures } from '@/shared/utils/BetaTestFeaturesService'
import { anotherDialogOrMenuIsOpen, keyboardEventTargetIsAnyFormElement } from '@/shared/utils/event'

const DO_NOT_RE_FETCH_SAME_ASSET_DETAIL_TIME = 5 * 1000
export const SORT_BY_SCORE_DATE = 'score_date'
export const SORT_BY_SCORE_BEST = 'score_best'
/**
 * Marks the detail dialog among open dialogs. Every other dialog opens over it.
 */
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

/*
 * Bumped whenever the list restarts from page one, so an in-flight
 * request can tell its rows and counter belong to a stale list.
 * Starts at 1 so the 0 "nothing postponed" marker is never a valid generation.
 */
let listGeneration = 1

/*
 * Generation whose next page is in flight, or 0 for none. One at a time per generation: two would
 * append in answer order, and a failed page is lost if the other moved the counter past it.
 * One left over from a replaced list blocks nothing.
 */
let nextPageInFlightGeneration = 0
let firstPageInFlight = false
/*
 * Generation the postponed scroll was requested in, or 0 for none.
 * A request from a replaced list is stale, and serving it too early fetches page two before page one.
 */
let nextPageAskedInGeneration = 0

export function useAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const router = useRouter()
  // Follow-up of a failed read runs only while on the page, including after a leave question answered "Stay".
  const whileOnPage = useWhileOnPage()
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

  const checkQuickDetailReFetch = (assetId: DocId) =>
    // The detail must still hold that asset. Editing a queue row writes another asset without the stamp.
    assetDetailStore.asset?.id === assetId &&
    assetDetailStore.lastFetchedId === assetId &&
    Date.now() - assetDetailStore.lastFetched <= DO_NOT_RE_FETCH_SAME_ASSET_DETAIL_TIME

  const fetchAsset = async (assetId: DocId, detailRequest: number) => {
    /*
     * Stamp only on success and only for the current request.
     * A stamped failure held the cache for five seconds. A stale
     * answer made the next open short-circuit to another asset.
     */
    const asset = await apiFetchAsset(assetId)
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.updateLastFetched(assetId)

    return asset
  }

  /*
   * With the detail closed, the side panel holds typed data and reading an asset replaces it, so ask first.
   * Not when nothing is read, as for the asset the panel just read. Its tile and pencil keep the typed data.
   * While the question is open, each such step is another ask and is told to stay.
   */
  const readReplacesUnsavedOfPanel = (assetId: DocId) =>
    assetDetailStore.panelHoldsUnsavedMetadata &&
    (assetDetailStore.leaveUnsavedQuestion || !checkQuickDetailReFetch(assetId))

  /*
   * Asks, and if told to leave, returns where the asset is now. The list can reload
   * while the question is open, so the clicked index may point to another asset or none.
   * Returns `null` to stay.
   */
  const leaveUnsavedFor = async <T extends { assetId: DocId; index: number }>(clicked: T) => {
    if (!(await assetDetailStore.askToLeaveUnsaved())) return null
    // Prefer the clicked index while it still holds the asset. An asset
    // listed twice would otherwise be found at its first position.
    if (assetListStore.list[clicked.index]?.asset.id === clicked.assetId) return clicked
    const index = assetListStore.list.findIndex((item) => item.asset.id === clicked.assetId)

    return index < 0 ? null : { ...clicked, index }
  }

  /**
   * The asset the side panel shows. Behind its loader, the one being read. None when unknown.
   */
  const shownInPanel = () => assetDetailStore.shownOrReadAssetId()

  /**
   * Target of `nextItem` (1) or `prevItem` (-1): the active tile's neighbour, none at either end.
   * With no active tile, next is the first and there is no previous.
   */
  const neighbourOfActive = (step: 1 | -1): AssetListItem | undefined =>
    assetListStore.list[(assetListStore.activeItemIndex ?? -1) + step]

  /*
   * The library replaces the ref's value before it returns. So each request gets
   * its own ref, and only the answer that still owns the list is copied back.
   * A stale answer told the new list there was nothing more to load.
   */
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
      // Two filter changes can answer in any order. Without this check the older one wins.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        assetListStore.setList(firstPage, uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT), shownInPanel())
        // Also update the detail or panel holding one of them whose main file is still loading.
        firstPage.forEach((asset) => assetDetailStore.mainFileOfRead(asset))
      }
    } catch (error) {
      // Also drop a scroll made while this was loading. Its page two would land on a missing page one.
      if (generation === listGeneration) nextPageAskedInGeneration = 0
      showErrorsDefault(error)
    } finally {
      if (generation === listGeneration) {
        firstPageInFlight = false
        // Only the newest request hides it. An older answer hiding it would show rows from before both changes.
        assetListStore.hideLoader('hard')
      }
      await servePostponedScroll()
    }
  }

  const resetAssetList = async () => {
    assetListStore.resetList()
    resetFilter(pagination, fetchAssetList)
  }

  /*
   * Kept waiting while this generation still has a request in flight; whichever finishes last serves it.
   * Dropped when its list is replaced, or when an answer says there is no next page.
   */
  const servePostponedScroll = async () => {
    // Checked first: while a request is out, `hasNextPage` still holds the previous answer.
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
      // Apply only to the list that requested it, not one a filter change has put in its place.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        assetListStore.appendList(nextPage, uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT), shownInPanel())
        nextPage.forEach((asset) => assetDetailStore.mainFileOfRead(asset))
      }
    } catch (error) {
      // Otherwise the next scroll skips the failed page.
      if (generation === listGeneration) {
        pagination.value.page = requestedPage - 1
      }
      showErrorsDefault(error)
    } finally {
      /*
       * Tied to owning the flag, not to the generation. Only a newer
       * next-page request takes it, and it raised the spinner itself.
       * A generation that moved on without one leaves nobody to
       * lower `soft`, because `fetchAssetList` raises only `hard`.
       */
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
    await openDetailOf(data)
  }

  // Opens the tile's detail once no unsaved typed data stands in the way.
  const openDetailOf = async (data: { assetId: DocId; index: number }) => {
    assetDetailStore.setView('list')
    assetListStore.keyboardNavigationEnable()
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    assetDetailStore.showDetail()
    const detailRequest = assetDetailStore.startDetailRequest(data.assetId)
    browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets/[id]', params: { id: data.assetId } })
    if (checkQuickDetailReFetch(data.assetId)) {
      assetDetailStore.hideLoader()
      return
    }
    // The list comes from a lagging index, so the asset may be gone when clicked.
    try {
      const res = await fetchAsset(data.assetId, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res, detailRequest)
      addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /*
       * Reset, not just closed. The dialog renders only the loader
       * or the asset, and the right panel renders the same asset.
       * Otherwise the previous asset would stay there with a working Save button.
       */
      assetDetailStore.reset()
      // The URL was changed to this asset before the request, so restore it while the user is still on the page.
      if (!dialogWasOpen) return
      whileOnPage(() => {
        browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
        showErrorsDefault(error)
      })
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  // Reads the whole asset behind the loader. This is the detail read when no typed data waits to be saved.
  const readHeldAssetWhole = async () => {
    const held = assetDetailStore.asset
    if (isNull(held)) return
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest(held.id)
    try {
      const res = await fetchAsset(held.id, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res, detailRequest)
      addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      // Called from both the dialog and the sidebar, so it must undo both.
      assetDetailStore.reset()
      whileOnPage(() => {
        browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
        showErrorsDefault(error)
      })
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /*
   * Re-reads the detail's asset, in the dialog and in the side panel. Reasons: its file
   * URL changed, another file became main, or the server processed it (`byServer`).
   * The active tile can be another asset, because a queue row's detail is not of the list.
   */
  const refreshActiveItem = (byServer = false) => readAfterFileChange(readHeldAssetWhole, byServer)

  /*
   * "Edit" in the side panel opens the detail over the panel's asset.
   * Read it whole, as its pencil does, when no typed data waits to be saved.
   * This frees a held-back "Save", as the hint below it says. Skip if just read.
   */
  const readHeldUnlessTyped = async () => {
    const held = assetDetailStore.asset
    if (isNull(held) || assetDetailStore.holdsUnsavedMetadata || checkQuickDetailReFetch(held.id)) return
    await readHeldAssetWhole()
  }

  /*
   * A double click on a tile is two clicks then a dblclick. The first
   * click asks, so the rest lands on the question dialog over the tile.
   * A dblclick heard while the question is open, on the tile or the question at its
   * position but not inside its card, opens the tile's detail once told to leave.
   * Not if a button inside the card was pressed since the question opened. The browser can send
   * a dblclick, with its second click in the card, to an element containing both tile and card.
   */
  const leaveUnsavedForClick = async (clicked: { assetId: DocId; index: number; tile?: Element | null }) => {
    let doubled = false
    let pressedInCard = false
    const pressed = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('.v-overlay__content')) pressedInCard = true
    }
    const heard = (event: MouseEvent) => {
      const tile = clicked.tile
      const target = event.target instanceof Element ? event.target : null
      if (!tile || !target || pressedInCard) return
      if (tile.contains(target)) {
        doubled = true
        return
      }
      if (target.closest('.v-overlay__content')) return
      const place = tile.getBoundingClientRect()
      const x = event.clientX
      const y = event.clientY
      if (x >= place.left && x <= place.right && y >= place.top && y <= place.bottom) doubled = true
    }
    window.addEventListener('mousedown', pressed, { capture: true })
    window.addEventListener('dblclick', heard, { capture: true })
    try {
      const data = await leaveUnsavedFor(clicked)

      return isNull(data) ? null : { data, doubled }
    } finally {
      window.removeEventListener('mousedown', pressed, { capture: true })
      window.removeEventListener('dblclick', heard, { capture: true })
    }
  }

  const onItemClick = async (clicked: { assetId: DocId; index: number; tile?: Element | null }) => {
    let data = clicked
    if (readReplacesUnsavedOfPanel(clicked.assetId)) {
      const asked = await leaveUnsavedForClick(clicked)
      if (isNull(asked)) return
      if (asked.doubled) return openDetailOf(asked.data)
      data = asked.data
    }
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest(data.assetId)
    if (sidebarRight) sidebarRight.value = true
    if (checkQuickDetailReFetch(data.assetId)) {
      assetDetailStore.hideLoader()
      return
    }
    try {
      const res = await fetchAsset(data.assetId, detailRequest)
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res, detailRequest)
      addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
      fetchCachedUsers()
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      // The sidebar keeps its last asset and would show it under the newly selected one.
      assetDetailStore.reset()
      whileOnPage(() => showErrorsDefault(error))
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /*
   * The highlight follows the queue instead of manual syncing. Cancel and delete in the mass-edit
   * dialog cannot reach the list, and left tiles highlighted for assets nothing would save.
   */
  watch(
    () =>
      uploadQueuesStore
        .getQueueItems(QUEUE_ID_MASS_EDIT)
        // Filtered by type too, the same rule `setList` applies.
        .filter((item) => item.type === UploadQueueItemType.Asset)
        .map((item) => item.assetId),
    (assetIds) => {
      assetListStore.setSelectedByIds(assetIds.filter((assetId) => !isNull(assetId)) as DocId[])
    }
  )

  /*
   * An asset being deleted, here or per the server, cannot be picked
   * for mass edit. Its row would offer a bin that deletes it again.
   * If already picked, it can be unpicked.
   */
  const isDeleting = (asset: AssetSearchListItemDto) => asset.attributes.assetStatus === DamAssetStatus.Deleting

  const toggleSelected = (data: { assetId: DocId; index: number }) => {
    if (assetListStore.list[data.index].selected) {
      uploadQueuesStore.removeByAssetId(QUEUE_ID_MASS_EDIT, data.assetId)
      assetListStore.toggleSelectedByIndex(data.index)
      return
    }
    if (isDeleting(assetListStore.list[data.index].asset)) return
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
      selecting = assetListStore.list.slice(data.index, activeIndex + 1).map((item) => item.asset)
    } else if (activeIndex < data.index) {
      selecting = assetListStore.list.slice(activeIndex, data.index + 1).map((item) => item.asset)
    }
    // A range selection skips them.
    selecting = selecting.filter((asset) => !isDeleting(asset))
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
      assetListStore.toggleSelectedByIds(selecting.map((item) => item.id))
    }
  }

  const nextItem = async () => {
    // Resolved first: at the end of the list there is nowhere to go, so nothing to ask, show or read.
    const target = neighbourOfActive(1)
    if (isUndefined(target)) return
    // Reading the next asset replaces the detail. Unsaved metadata is dropped only after confirmation.
    if (assetDetailStore.showsUnsavedMetadata && !(await assetDetailStore.askToLeaveUnsaved())) return
    if (readReplacesUnsavedOfPanel(target.asset.id) && !(await assetDetailStore.askToLeaveUnsaved())) return
    assetListStore.setActiveNext()
    if (isNull(assetListStore.activeItemIndex)) return
    // Checked before the loader goes up. The active index can outlive the list, and this threw with the loader up.
    const nextAsset = assetListStore.list[assetListStore.activeItemIndex]
    if (isUndefined(nextAsset)) return
    assetDetailStore.showLoader()
    const newAssetId = nextAsset.asset.id
    const detailRequest = assetDetailStore.startDetailRequest(newAssetId)
    // The URL belongs to the open detail. With none open, the list is walked and its URL stays.
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
      assetDetailStore.setAsset(res, detailRequest)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /*
       * Reset, not just closed. The dialog renders only the loader
       * or the asset, and the right panel renders the same asset.
       * Otherwise the previous asset would stay there with a working Save button.
       */
      assetDetailStore.reset()
      // The URL was changed only for an open detail. Restore it while the user is still on the page.
      whileOnPage(() => {
        if (dialogWasOpen) browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
        showErrorsDefault(error)
      })
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const prevItem = async () => {
    // Same as `nextItem`: nowhere to go from the first one, so resolved first.
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
    const detailRequest = assetDetailStore.startDetailRequest(newAssetId)
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
      assetDetailStore.setAsset(res, detailRequest)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /*
       * Reset, not just closed. The dialog renders only the loader
       * or the asset, and the right panel renders the same asset.
       * Otherwise the previous asset would stay there with a working Save button.
       */
      assetDetailStore.reset()
      // The same as `nextItem`: the address was changed only for an open detail.
      whileOnPage(() => {
        if (dialogWasOpen) browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
        showErrorsDefault(error)
      })
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const listMounted = async () => {
    uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
    // Not `resetList`, which keeps the active tile's asset for the next read. The page starts with none.
    assetListStore.reset()
    await fetchAssetList()
    assetListStore.keyboardNavigationEnable()
  }

  const listUnmounted = () => {
    assetListStore.keyboardNavigationDisable()
    /*
     * The list is going, and its detail with it. A pending request must not answer into the replacement, and
     * an open question has no page to render it, so it would wait forever and tell the next ask to stay.
     * Unsaved metadata is also dropped. The licence dialog renders on other
     * pages too and would ask about it where nothing renders the question.
     */
    assetDetailStore.reset()
  }

  /*
   * Keys are heard on the whole window, so also with a dialog or menu open over the detail. Reading the next
   * asset puts the detail behind its loader and unmounts what is open over it, losing a half-filled form.
   * With the detail closed, also ignored under a page dialog or menu, because the list is not in use.
   */
  const underDialogOrMenu = () =>
    assetDetailStore.detail ? anotherDialogOrMenuIsOpen('.' + ASSET_DETAIL_DIALOG_CLASS) : anotherDialogOrMenuIsOpen()

  /*
   * A full-page queue (upload, mass edit) covers the list. The keys
   * would walk hidden tiles and read their assets into the panel.
   * The queue disables the keys itself. A queue row's detail re-enables them when it closes or fails to open.
   */
  const listIsUnderQueue = () => customDialog.value

  /*
   * A detail opened outside the list, such as a queue row edit or a newly created
   * asset, has no tile. The keys would read the active tile's neighbour into it.
   */
  const detailIsNotOfList = () => assetDetailStore.detail && assetDetailStore.view !== 'list'

  const onArrowRight = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !assetListStore.keyboardNavigation) return
    if (listIsUnderQueue() || detailIsNotOfList() || underDialogOrMenu()) return
    await nextItem()
  }

  const onArrowLeft = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !assetListStore.keyboardNavigation) return
    if (listIsUnderQueue() || detailIsNotOfList() || underDialogOrMenu()) return
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
    readHeldUnlessTyped,
    onItemClick,
    prevItem,
    nextItem,
    neighbourOfActive,
    onArrowRight,
    onArrowLeft,
  }
}
