import {
  UploadQueueItemType,
  isNull,
  isUndefined,
  useAlerts,
  useDamConfigState,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import type { Pagination } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useExternalProviders } from '@/domains/coreDam/asset/composables/externalProviders'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import {
  useFetchExternalProviderAsset,
  useFetchExternalProviderAssetList,
} from '@/domains/coreDam/externalProvider/api/externalProviderAssetApi'
import { useExternalProviderAssetListFilter } from '@/domains/coreDam/externalProvider/filter/ExternalProviderAssetFilter'
import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'
import { useExternalProviderAssetListStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetListStore'
import type { ExternalProviderAssetListItem } from '@/domains/coreDam/externalProvider/store/externalProviderAssetListStore'
import { QUEUE_ID_MASS_EDIT } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { damClient } from '@/shared/apiClients/damClient'
import { useBetaTestFeatures } from '@/shared/utils/BetaTestFeaturesService'
import { anotherDialogOrMenuIsOpen, keyboardEventTargetIsAnyFormElement } from '@/shared/utils/event'

/**
 * Marks the detail dialog among open dialogs. Every other dialog opens over it.
 */
export const EXTERNAL_PROVIDER_DETAIL_DIALOG_CLASS = 'dam-external-provider-detail-dialog'

const { showWarning, showErrorsDefault } = useAlerts()
const { customDialog } = useMainWrapper()

const { filterData, filterConfig } = useExternalProviderAssetListFilter()
const { pagination } = usePagination(null)
const { activeExternalProvider } = useExternalProviders()

/*
 * Bumped whenever the list restarts from page one, so an in-flight request can tell its list is gone.
 * Starts at 1 so it cannot equal the 0 'nothing in flight' marker.
 */
let listGeneration = 1

/*
 * Generation whose next page is in flight, or 0 for none. One at a time per generation, as in the core list.
 * A leftover from a replaced list blocks nothing.
 */
let nextPageInFlightGeneration = 0
let firstPageInFlight = false
/*
 * Generation the postponed scroll was requested in, or 0 for none.
 * A request from a replaced list is stale, and serving it too early fetches page two before page one.
 */
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
  const { execute } = useFetchExternalProviderAssetList()
  const { execute: fetchExternalProviderAsset } = useFetchExternalProviderAsset()
  const { maxSelectedItems } = useBetaTestFeatures()
  const { list, loader, activeItemIndex } = storeToRefs(externalProviderAssetListStore)

  /**
   * Asset shown in the side panel, or null while it is loading or empty.
   */
  const shownInPanel = () => (assetDetailStore.loader ? null : (assetDetailStore.asset?.id ?? null))

  /*
   * The library replaces the ref's value, so each request gets its own ref.
   * Only the answer that still owns the list is copied back.
   */
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
      const firstPage = await execute(answered, filterData, filterConfig, {
        urlParams: { externalProvider: activeExternalProvider.value },
      })
      // Two filter changes can answer in any order. Without this check the older one wins.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        externalProviderAssetListStore.setList(
          firstPage,
          uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT),
          shownInPanel()
        )
      }
    } catch (error) {
      // Also drop a scroll made while this was loading. Its page two would land on a missing page one.
      if (generation === listGeneration) nextPageAskedInGeneration = 0
      showErrorsDefault(error)
    } finally {
      if (generation === listGeneration) {
        firstPageInFlight = false
        // Only the newest request hides it. An older answer hiding it would show rows from before both changes.
        externalProviderAssetListStore.hideLoader('hard')
      }
      await servePostponedScroll()
    }
  }

  const resetAssetList = async () => {
    externalProviderAssetListStore.resetList()
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
      const nextPage = await execute(answered, filterData, filterConfig, {
        urlParams: { externalProvider: activeExternalProvider.value },
      })
      // Apply only to the list that requested it, not one a filter change has put in its place.
      if (generation === listGeneration) {
        acceptPaginationAnswer(answered)
        externalProviderAssetListStore.appendList(
          nextPage,
          uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT),
          shownInPanel()
        )
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
    // Without the finally a failed fetch leaves the panel spinning with no close button.
    try {
      const res = await fetchExternalProviderAsset({
        urlParams: { externalProvider: activeExternalProvider.value, id: data.assetId },
      })
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      assetDetailStore.setAsset(res)
    } catch (error) {
      if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
      const dialogWasOpen = assetDetailStore.detail
      /*
       * Reset, not just closed: the panel renders the same asset, and Import reads the active list item.
       * A stale one would be imported as the newly selected one.
       */
      assetDetailStore.reset()
      // If the dialog closed meanwhile, the user no longer waits for this answer.
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
      // Reset because the sidebar keeps its last asset and Import reads the active list item.
      assetDetailStore.reset()
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /*
   * As in the asset list: the selection dialog bin and the import, which clears the queue, cannot reach this list.
   * Without this, tiles stay highlighted for already imported assets.
   */
  watch(
    () =>
      uploadQueuesStore
        .getQueueItems(QUEUE_ID_MASS_EDIT)
        // Filter by type too, as `setList` does.
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
      selecting = externalProviderAssetListStore.list.slice(data.index, activeIndex + 1).map((item) => item.asset)
    } else if (activeIndex < data.index) {
      selecting = externalProviderAssetListStore.list.slice(activeIndex, data.index + 1).map((item) => item.asset)
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
      externalProviderAssetListStore.toggleSelectedByIds(selecting.map((item) => item.id))
    }
  }

  /**
   * Target of `nextItem` (1) or `prevItem` (-1): the active item's neighbour, or none at a list end.
   * With no active tile, next is the first and there is no previous, matching the store.
   */
  const neighbourOfActive = (step: 1 | -1): ExternalProviderAssetListItem | undefined =>
    externalProviderAssetListStore.list[(externalProviderAssetListStore.activeItemIndex ?? -1) + step]

  const nextItem = async () => {
    // Checked first: at the end of the list there is nothing to show or read.
    if (isUndefined(neighbourOfActive(1))) return
    externalProviderAssetListStore.setActiveNext()
    if (isNull(externalProviderAssetListStore.activeItemIndex) || !activeExternalProvider.value) return
    // Checked before the loader goes up. The active index can outlive the list, and this threw with the loader up.
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
      /*
       * Reset, not just closed: the panel renders the same asset, and Import reads the active list item.
       * A stale one would be imported as the newly selected one.
       */
      assetDetailStore.reset()
      // If the dialog closed meanwhile, the user no longer waits for this answer.
      if (!dialogWasOpen) return
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  const prevItem = async () => {
    if (isUndefined(neighbourOfActive(-1))) return
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
      /*
       * Reset, not just closed: the panel renders the same asset, and Import reads the active list item.
       * A stale one would be imported as the newly selected one.
       */
      assetDetailStore.reset()
      // If the dialog closed meanwhile, the user no longer waits for this answer.
      if (!dialogWasOpen) return
      showErrorsDefault(error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /*
   * As in the asset list: a full-page queue (upload or import selection) covers the list.
   * The keys would walk hidden tiles and load their assets into the panel.
   * The upload queue disables keys only for the asset list, not this one.
   */
  const listIsUnderQueue = () => customDialog.value

  /*
   * As in the asset list: not under a dialog or menu over the detail, or over the list with the detail closed.
   * Reading the next asset would close what is open over the detail, and the list is not in use.
   */
  const underDialogOrMenu = () =>
    assetDetailStore.detail
      ? anotherDialogOrMenuIsOpen('.' + EXTERNAL_PROVIDER_DETAIL_DIALOG_CLASS)
      : anotherDialogOrMenuIsOpen()

  const onArrowRight = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !externalProviderAssetListStore.keyboardNavigation) return
    if (listIsUnderQueue() || underDialogOrMenu()) return
    await nextItem()
  }

  const onArrowLeft = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !externalProviderAssetListStore.keyboardNavigation) return
    if (listIsUnderQueue() || underDialogOrMenu()) return
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
    // Fresh start: the asset of a tile active on an earlier visit should not be restored.
    externalProviderAssetListStore.reset()
    assetDetailStore.reset()
    await fetchAssetList()
    externalProviderAssetListStore.keyboardNavigationEnable()
  }

  const listUnmounted = () => {
    externalProviderAssetListStore.keyboardNavigationDisable()
    // The list is leaving; a pending detail request must not write into what replaces it.
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
    neighbourOfActive,
    onArrowRight,
    onArrowLeft,
  }
}
