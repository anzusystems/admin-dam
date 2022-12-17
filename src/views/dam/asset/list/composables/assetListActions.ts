import { usePagination } from '@/composables/system/pagination'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import { fetchAsset, fetchAssetList as apiFetchAssetList } from '@/services/api/dam/assetApi'
import { useAssetListFilter } from '@/model/dam/filter/AssetFilter'
import { storeToRefs } from 'pinia'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { isNull } from '@/utils/common'
import { toggleArrayItem } from '@/utils/array'
import { useCurrentAssetLicence } from '@/composables/system/currentLicence'
import { useErrorHandler } from '@/composables/system/error'
import { computed, readonly, type Ref, ref } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import { useAlerts } from '@/composables/system/alerts'
import type { DocId } from '@/types/common'
import type { AssetSearchListItemDto } from '@/types/dam/Asset'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { loadLazyUser } from '@/views/dam/user/composables/lazyUser'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'

const { handleError } = useErrorHandler()
const { showWarning } = useAlerts()

const filter = useAssetListFilter()
const pagination = usePagination()
pagination.sortBy = 'createdAt'
pagination.rowsPerPage = 25 // todo

const filterIsTouched = ref(false)

export function useAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const assetListStore = useAssetListStore()
  const assetDetailStore = useAssetDetailStore()
  const uploadQueuesStore = useUploadQueuesStore()

  const { list, loader, activeItemIndex } = storeToRefs(assetListStore)
  const { resetFilter } = useFilterHelpers()
  const { currentAssetLicenceId } = useCurrentAssetLicence()
  const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()
  const { maxSelectedItems } = useBetaTestFeatures()

  const fetchAssetList = async () => {
    pagination.page = 1
    try {
      assetListStore.showLoader('hard')
      assetListStore.setList(
        await apiFetchAssetList(currentAssetLicenceId.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      handleError(error)
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
      handleError(error)
    } finally {
      assetListStore.hideLoader('soft')
    }
  }

  const setTypeAndFetch = async (type: null | AssetType = null) => {
    if (isNull(type)) {
      filter.type.model = []
      filter.inPodcast.model = null
      await fetchAssetList()
      return
    }
    toggleArrayItem(filter.type.model, type)
    if (!filter.type.model.includes(AssetType.Audio) && filter.inPodcast.model) {
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
    filter.type.model = [AssetType.Audio]
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
    const res = await fetchAsset(data.assetId)
    assetDetailStore.setAsset(res)
    if (assetDetailStore.asset?.createdBy) {
      addToLazyUserBuffer(assetDetailStore.asset.createdBy)
    }
    if (assetDetailStore.asset?.modifiedBy) {
      addToLazyUserBuffer(assetDetailStore.asset.modifiedBy)
    }
    fetchLazyUser()
    assetDetailStore.hideLoader()
  }

  const onItemClick = async (data: { assetId: DocId; index: number }) => {
    assetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    if (sidebarRight) sidebarRight.value = true
    const res = await fetchAsset(data.assetId)
    assetDetailStore.setAsset(res)
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
    const res = await fetchAsset(assetListStore.list[assetListStore.activeItemIndex].asset.id)
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const prevItem = async () => {
    assetListStore.setActivePrev()
    if (isNull(assetListStore.activeItemIndex)) return
    assetDetailStore.showLoader()
    const res = await fetchAsset(assetListStore.list[assetListStore.activeItemIndex].asset.id)
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

  const onArrowRight = async (e: KeyboardEvent) => {
    e.preventDefault()
    if (!assetListStore.keyboardNavigation) return
    await nextItem()
  }

  const onArrowLeft = async (e: KeyboardEvent) => {
    e.preventDefault()
    if (!assetListStore.keyboardNavigation) return
    await prevItem()
  }

  const totalCountText = computed(() => {
    const count = assetListStore.list.length
    return count > 0 ? count + (pagination.hasNextPage ? '+' : '') : '0'
  })

  return {
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
    totalCountText,
    showDetail,
    onItemClick,
    prevItem,
    nextItem,
    onArrowRight,
    onArrowLeft,
  }
}
