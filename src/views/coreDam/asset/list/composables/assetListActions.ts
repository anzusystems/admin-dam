import type { AssetSearchListItemDto, DocId } from '@anzusystems/common-admin'
import {
  arrayItemToggle,
  browserHistoryReplaceUrlByRouter,
  DamAssetType,
  isNull,
  useAlerts,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'
import { fetchAsset as apiFetchAsset, fetchAssetList as apiFetchAssetList } from '@/services/api/coreDam/assetApi'
import { useAssetListFilter } from '@/model/coreDam/filter/AssetFilter'
import { storeToRefs } from 'pinia'
import { readonly, type Ref, ref } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import { keyboardEventTargetIsAnyFormElement } from '@/utils/event'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'

const DO_NOT_RE_FETCH_SAME_ASSET_DETAIL_TIME = 5 * 1000

const { showWarning, showErrorsDefault } = useAlerts()

const filter = useAssetListFilter()
const pagination = usePagination()
pagination.sortBy = 'createdAt'
pagination.rowsPerPage = 25 // todo

const filterIsTouched = ref(false)

export function useAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const router = useRouter()
  const assetListStore = useAssetListStore()
  const assetDetailStore = useAssetDetailStore()
  const uploadQueuesStore = useUploadQueuesStore()

  const { list, loader, activeItemIndex } = storeToRefs(assetListStore)
  const { resetFilter } = useFilterHelpers()
  const { currentAssetLicenceId } = useCurrentAssetLicence()
  const { fetchCachedUsers, addToCachedUsers } = useCachedUsers()
  const { maxSelectedItems } = useBetaTestFeatures()
  const showMetaIcons = ref(true)

  const toggleShowMetaIcons = () => {
    showMetaIcons.value = !showMetaIcons.value
  }

  const checkQuickDetailReFetch = (assetId: DocId) => {
    return (
      assetDetailStore.lastFetchedId === assetId &&
      Date.now() - assetDetailStore.lastFetched <= DO_NOT_RE_FETCH_SAME_ASSET_DETAIL_TIME
    )
  }

  const fetchAsset = async (assetId: DocId) => {
    assetDetailStore.updateLastFetched(assetId)
    return await apiFetchAsset(assetId)
  }

  const fetchAssetList = async () => {
    pagination.page = 1
    try {
      assetListStore.showLoader('hard')
      assetListStore.setList(
        await apiFetchAssetList(currentAssetLicenceId.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      assetListStore.hideLoader('hard')
    }
  }

  const resetAssetList = async () => {
    assetListStore.resetList()
    resetFilter(filter, pagination, fetchAssetList)
  }

  const fetchNextPage = async () => {
    const { maxAssetListItems } = useBetaTestFeatures()
    if (assetListStore.list.length >= maxAssetListItems.value) {
      showWarning('Maximum listing limit reached, please update your filter for better result.')
      return
    }
    pagination.page = pagination.page + 1
    try {
      assetListStore.showLoader('soft')
      assetListStore.appendList(
        await apiFetchAssetList(currentAssetLicenceId.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      assetListStore.hideLoader('soft')
    }
  }

  const setTypeAndFetch = async (type: null | DamAssetType = null) => {
    if (isNull(type)) {
      filter.type.model = []
      filter.inPodcast.model = null
      await fetchAssetList()
      return
    }
    arrayItemToggle(filter.type.model, type)
    if (!filter.type.model.includes(DamAssetType.Audio) && filter.inPodcast.model) {
      filter.inPodcast.model = null
    }
    await fetchAssetList()
  }

  const togglePodcastAndFetch = async () => {
    if (filter.inPodcast.model) {
      filter.inPodcast.model = null
      await fetchAssetList()
      return
    }
    filter.inPodcast.model = true
    filter.type.model = [DamAssetType.Audio]
    await fetchAssetList()
  }

  const filterTouch = () => {
    filterIsTouched.value = true
  }
  const filterUnTouch = () => {
    filterIsTouched.value = false
  }

  const showDetail = async (data: { assetId: DocId; index: number }) => {
    assetDetailStore.setView('list')
    assetListStore.keyboardNavigationEnable()
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    assetDetailStore.showDetail()
    browserHistoryReplaceUrlByRouter(router, { name: ROUTE.DAM.ASSET.DETAIL, params: { id: data.assetId } })
    if (checkQuickDetailReFetch(data.assetId)) {
      assetDetailStore.hideLoader()
      return
    }
    const res = await fetchAsset(data.assetId)
    assetDetailStore.setAsset(res)
    addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
    fetchCachedUsers()
    assetDetailStore.hideLoader()
  }

  const refreshActiveItem = async () => {
    console.log('aa')
    const activeAsset = assetListStore.getActiveAsset()
    if (isNull(activeAsset)) return

    assetDetailStore.showLoader()
    const res = await fetchAsset(activeAsset.asset.id)
    assetDetailStore.setAsset(res)
    addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
    fetchCachedUsers()
    assetDetailStore.hideLoader()
  }

  const onItemClick = async (data: { assetId: DocId; index: number }) => {
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    if (sidebarRight) sidebarRight.value = true
    if (checkQuickDetailReFetch(data.assetId)) {
      assetDetailStore.hideLoader()
      return
    }
    const res = await fetchAsset(data.assetId)
    assetDetailStore.setAsset(res)
    addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
    fetchCachedUsers()
    assetDetailStore.hideLoader()
  }

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
    if (selectedQueueTotalCount + selecting.length >= maxSelectedItems.value) {
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
    assetListStore.setActiveNext()
    if (isNull(assetListStore.activeItemIndex)) return
    assetDetailStore.showLoader()
    const newAssetId = assetListStore.list[assetListStore.activeItemIndex].asset.id
    browserHistoryReplaceUrlByRouter(router, { name: ROUTE.DAM.ASSET.DETAIL, params: { id: newAssetId } })
    if (checkQuickDetailReFetch(newAssetId)) {
      assetDetailStore.hideLoader()
      return
    }
    const res = await fetchAsset(newAssetId)
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const prevItem = async () => {
    assetListStore.setActivePrev()
    if (isNull(assetListStore.activeItemIndex)) return
    assetDetailStore.showLoader()
    const newAssetId = assetListStore.list[assetListStore.activeItemIndex].asset.id
    browserHistoryReplaceUrlByRouter(router, { name: ROUTE.DAM.ASSET.DETAIL, params: { id: newAssetId } })
    if (checkQuickDetailReFetch(newAssetId)) {
      assetDetailStore.hideLoader()
      return
    }
    const res = await fetchAsset(newAssetId)
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const listMounted = async () => {
    uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
    assetListStore.resetList()
    assetDetailStore.reset()
    await fetchAssetList()
    assetListStore.keyboardNavigationEnable()
  }

  const listUnmounted = () => {
    assetListStore.keyboardNavigationDisable()
  }

  const onArrowRight = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !assetListStore.keyboardNavigation) return
    await nextItem()
  }

  const onArrowLeft = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !assetListStore.keyboardNavigation) return
    await prevItem()
  }

  return {
    showMetaIcons: readonly(showMetaIcons),
    toggleShowMetaIcons,
    activeItemIndex,
    loader,
    items: list,
    pagination,
    filter,
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
    onArrowRight,
    onArrowLeft,
  }
}
