import { UploadQueueItemType, useDamConfigState } from '@anzusystems/common-admin'
import { type Pagination, useFilterHelpers, usePagination } from '@anzusystems/common-admin/labs'
import { useExternalProviderAssetListFilter } from '@/domains/coreDam/externalProvider/filter/ExternalProviderAssetFilter'
import {
  useFetchExternalProviderAsset,
  useFetchExternalProviderAssetList,
} from '@/domains/coreDam/externalProvider/api/externalProviderAssetApi'
import { useExternalProviders } from '@/domains/coreDam/asset/composables/externalProviders'
import { useExternalProviderAssetListStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { useBetaTestFeatures } from '@/shared/BetaTestFeaturesService'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'
import { keyboardEventTargetIsAnyFormElement } from '@/shared/utils/event'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'

const { showWarning, showErrorsDefault } = useAlerts()

const { filterData, filterConfig } = useExternalProviderAssetListFilter()
const { pagination } = usePagination(null)
const { activeExternalProvider } = useExternalProviders()

/* Bumped whenever the list starts again from page one, so a request already on the wire can tell
 * that its list is gone. From one, so the 'nothing postponed' marker cannot pass for a generation. */
let listGeneration = 1

/* The generation whose next page is on the wire, or 0 for none - one at a time within a generation,
 * for the same reason as the core list; one left over from a replaced list holds nothing back. */
let nextPageInFlightGeneration = 0
let firstPageInFlight = false
/* The generation the postponed scroll was asked in, or 0 for none: one asked of a list since
 * replaced is not the same ask, and one served too early fetches page two before page one. */
let nextPageAskedInGeneration = 0

export function useExternalProviderAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()
  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }
  const assetDetailStore = useExternalProviderAssetDetailStore()
  const externalProviderAssetListStore = useExternalProviderAssetListStore()
  const uploadQueuesStore = useUploadQueuesStore()
  const { resetFilter } = useFilterHelpers(filterData, filterConfig, {
    populateUrlParams: false,
    storeFiltersLocalStorage: false,
  })
  const { executeFetch } = useFetchExternalProviderAssetList()
  const { executeRequest: fetchExternalProviderAsset } = useFetchExternalProviderAsset()
  const { maxSelectedItems } = useBetaTestFeatures()
  const { list, loader, activeItemIndex } = storeToRefs(externalProviderAssetListStore)

  /* The library replaces the value of the ref it is handed, so each request gets its own and only
   * the answer that still owns the list is copied back. */
  const paginationForRequest = () => ref({ ...pagination.value })
  const acceptPaginationAnswer = (answered: Ref<Pagination>) => {
    pagination.value.hasNextPage = answered.value.hasNextPage
    pagination.value.currentViewCount = answered.value.currentViewCount
  }

  const fetchAssetList = async () => {
    if (!activeExternalProvider.value) return
    pagination.value.page = 1
    const generation = ++listGeneration
    firstPageInFlight = true
    pagination.value.rowsPerPage =
      configExtSystem.assetExternalProviders?.[activeExternalProvider.value]?.listingLimit ?? 10
    try {
      externalProviderAssetListStore.showLoader('hard')
      const answered = paginationForRequest()
      const firstPage = await executeFetch(answered, filterData, filterConfig, {
        urlParams: { externalProvider: activeExternalProvider.value },
      })
      // Two filter changes answer in whatever order they like; the older one used to win.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        externalProviderAssetListStore.setList(firstPage, uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT))
      }
    } catch (error) {
      // And the scroll made while this was loading: its page two would land on a page one that is not there.
      if (generation === listGeneration) nextPageAskedInGeneration = 0
      showErrorsDefault(error)
    } finally {
      if (generation === listGeneration) {
        firstPageInFlight = false
        // Only the newest: an older answer taking it down shows the rows from before both changes.
        externalProviderAssetListStore.hideLoader('hard')
      }
      await servePostponedScroll()
    }
  }

  const resetAssetList = async () => {
    externalProviderAssetListStore.resetList()
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
    if (externalProviderAssetListStore.list.length >= maxAssetListItems.value) {
      showWarning('Maximum listing limit reached, please update your filter for better result.')
      return
    }
    if (!activeExternalProvider.value) return
    if (nextPageInFlightGeneration === listGeneration || firstPageInFlight) {
      nextPageAskedInGeneration = listGeneration

      return
    }
    const requestedPage = pagination.value.page + 1
    const generation = listGeneration
    pagination.value.page = requestedPage
    pagination.value.rowsPerPage =
      configExtSystem.assetExternalProviders?.[activeExternalProvider.value]?.listingLimit ?? 10
    nextPageInFlightGeneration = generation
    try {
      externalProviderAssetListStore.showLoader('soft')
      const answered = paginationForRequest()
      const nextPage = await executeFetch(answered, filterData, filterConfig, {
        urlParams: { externalProvider: activeExternalProvider.value },
      })
      // Only onto the list that asked for it, not the one a filter change has put in its place.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        externalProviderAssetListStore.appendList(nextPage, uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT))
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
        externalProviderAssetListStore.hideLoader('soft')
        nextPageInFlightGeneration = 0
      }
      await servePostponedScroll()
    }
  }

  const showDetail = async (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (!activeExternalProvider.value) return
    externalProviderAssetListStore.keyboardNavigationEnable()
    externalProviderAssetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    assetDetailStore.showDetail()
    const detailRequest = assetDetailStore.startDetailRequest()
    // Without the finally a failed fetch leaves the panel spinning, with no close button either.
    try {
      const res = await fetchExternalProviderAsset({
        urlParams: { externalProvider: activeExternalProvider.value, id: data.assetId },
      })
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /* Cleared, not merely closed: the panel renders the same asset, and the Import button reads
       * the active list item - a stale one would be imported as the newly selected one. */
      assetDetailStore.reset()
      // If the dialog has gone in the meantime, the user has stopped waiting for this answer.
      if (!dialogWasOpen) return
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const onItemClick = async (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (isNull(activeExternalProvider.value)) return
    externalProviderAssetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest()
    if (sidebarRight) sidebarRight.value = true
    try {
      const res = await fetchExternalProviderAsset({
        urlParams: { externalProvider: activeExternalProvider.value, id: data.assetId },
      })
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      // The sidebar keeps its last asset, and Import reads the active list item.
      assetDetailStore.reset()
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /* As in the asset list: the bin in the selection dialog and the import, which clears the whole queue, cannot reach
   * this list and left tiles highlighted for assets already imported. */
  watch(
    () =>
      uploadQueuesStore
        .getQueueItems(QUEUE_ID_MASS_EDIT)
        // By type as well, the same as `setList`.
        .filter((item) => item.type === UploadQueueItemType.ExternalProviderAsset)
        .map((item) => item.externalProviderAssetId),
    (assetIds) => {
      externalProviderAssetListStore.setSelectedByIds(
        assetIds.filter((assetId) => !isNull(assetId)) as AssetExternalProviderId[]
      )
    }
  )

  const toggleSelected = (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (externalProviderAssetListStore.list[data.index].selected) {
      uploadQueuesStore.removeByExternalProviderAssetId(QUEUE_ID_MASS_EDIT, data.assetId)
      externalProviderAssetListStore.toggleSelectedByIndex(data.index)
      return
    }
    if (uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT) >= maxSelectedItems.value) {
      showWarning('Max limit for multiselect (' + maxSelectedItems.value + ') reached.', 5)
      return
    }
    uploadQueuesStore.addByExternalProviderAsset(QUEUE_ID_MASS_EDIT, [
      externalProviderAssetListStore.list[data.index].asset,
    ])
    externalProviderAssetListStore.toggleSelectedByIndex(data.index)
  }

  const selectMultiple = (data: { assetId: AssetExternalProviderId; index: number }) => {
    let activeIndex = 0
    if (!isNull(externalProviderAssetListStore.activeItemIndex)) {
      activeIndex = externalProviderAssetListStore.activeItemIndex
    }
    if (activeIndex === data.index) return
    externalProviderAssetListStore.clearSelected()
    uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)

    let selecting: AssetExternalProviderListDto[] = []
    if (activeIndex > data.index) {
      selecting = externalProviderAssetListStore.list.slice(data.index, activeIndex + 1).map((item) => {
        return item.asset
      })
    } else if (activeIndex < data.index) {
      selecting = externalProviderAssetListStore.list.slice(activeIndex, data.index + 1).map((item) => {
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
      uploadQueuesStore.addByExternalProviderAsset(QUEUE_ID_MASS_EDIT, selecting)
      externalProviderAssetListStore.toggleSelectedByIds(
        selecting.map((item) => {
          return item.id
        })
      )
    }
  }

  const nextItem = async () => {
    externalProviderAssetListStore.setActiveNext()
    if (isNull(externalProviderAssetListStore.activeItemIndex) || !activeExternalProvider.value) return
    // Before the loader goes up: the active index outlives the list, and this threw with it up.
    if (isUndefined(externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex])) return
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest()
    try {
      const res = await fetchExternalProviderAsset({
        urlParams: {
          externalProvider: activeExternalProvider.value,
          id: externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex].asset.id,
        },
      })
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /* Cleared, not merely closed: the panel renders the same asset, and the Import button reads
       * the active list item - a stale one would be imported as the newly selected one. */
      assetDetailStore.reset()
      // If the dialog has gone in the meantime, the user has stopped waiting for this answer.
      if (!dialogWasOpen) return
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const prevItem = async () => {
    externalProviderAssetListStore.setActivePrev()
    if (isNull(externalProviderAssetListStore.activeItemIndex) || !activeExternalProvider.value) return
    // The same as `nextItem`: the index outlives the list it points into.
    if (isUndefined(externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex])) return
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest()
    try {
      const res = await fetchExternalProviderAsset({
        urlParams: {
          externalProvider: activeExternalProvider.value,
          id: externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex].asset.id,
        },
      })
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /* Cleared, not merely closed: the panel renders the same asset, and the Import button reads
       * the active list item - a stale one would be imported as the newly selected one. */
      assetDetailStore.reset()
      // If the dialog has gone in the meantime, the user has stopped waiting for this answer.
      if (!dialogWasOpen) return
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const onArrowRight = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !externalProviderAssetListStore.keyboardNavigation) return
    await nextItem()
  }

  const onArrowLeft = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !externalProviderAssetListStore.keyboardNavigation) return
    await prevItem()
  }

  const route = useRoute()
  const router = useRouter()
  const validateRouteProvider = async () => {
    const provider = (route.params as { provider?: string }).provider
    if (!provider || !configExtSystem.assetExternalProviders?.[provider]) {
      await router.push('/not-found')
      return
    }
    activeExternalProvider.value = provider
  }

  const listMounted = async () => {
    await validateRouteProvider()
    uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
    externalProviderAssetListStore.resetList()
    assetDetailStore.reset()
    await fetchAssetList()
    externalProviderAssetListStore.keyboardNavigationEnable()
  }

  const listUnmounted = () => {
    externalProviderAssetListStore.keyboardNavigationDisable()
    // The list is going; a detail it asked for must not answer onto whatever replaces it.
    assetDetailStore.abandonDetailRequests()
  }

  return {
    activeItemIndex,
    loader,
    items: list,
    pagination,
    filterData,
    filterConfig,
    fetchAssetList,
    resetAssetList,
    fetchNextPage,
    listMounted,
    listUnmounted,
    showDetail,
    onItemClick,
    toggleSelected,
    selectMultiple,
    prevItem,
    nextItem,
    onArrowRight,
    onArrowLeft,
  }
}
