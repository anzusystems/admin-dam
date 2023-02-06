import { usePagination } from '@/composables/system/pagination'
import { useExternalProviderAssetListFilter } from '@/model/dam/filter/ExternalProviderAssetFilter'
import { storeToRefs } from 'pinia'
import {
  fetchExternalProviderAsset,
  fetchExternalProviderAssetList as apiFetchExternalProviderAssetList,
} from '@/services/api/dam/externalProviderAssetApi'
import { useErrorHandler } from '@/composables/system/error'
import { useExternalProviders } from '@/composables/system/externalProviders'
import { useExternalProviderAssetListStore } from '@/stores/dam/externalProviderAssetListStore'
import { computed, readonly, type Ref, ref } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import { useAlerts } from '@/composables/system/alerts'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/dam/AssetExternalProvider'
import { isNull, isString } from '@/utils/common'
import { useExternalProviderAssetDetailStore } from '@/stores/dam/externalProviderAssetDetailStore'
import { ROUTE } from '@/router/routes'
import { useRoute, useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { keyboardEventTargetIsAnyFormElement } from '@/utils/event'

const { handleError } = useErrorHandler()
const { showWarning } = useAlerts()

const filter = useExternalProviderAssetListFilter()
const pagination = usePagination()
const { activeExternalProvider } = useExternalProviders()

const filterIsTouched = ref(false)

export function useExternalProviderAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const assetDetailStore = useExternalProviderAssetDetailStore()
  const externalProviderAssetListStore = useExternalProviderAssetListStore()
  const uploadQueuesStore = useUploadQueuesStore()
  const { resetFilter } = useFilterHelpers()
  const { maxSelectedItems } = useBetaTestFeatures()
  const { list, loader, activeItemIndex } = storeToRefs(externalProviderAssetListStore)

  const fetchAssetList = async () => {
    if (!activeExternalProvider.value) return
    pagination.page = 1
    pagination.rowsPerPage = damConfigExtSystem.assetExternalProviders[activeExternalProvider.value].listingLimit
    try {
      externalProviderAssetListStore.showLoader('hard')
      externalProviderAssetListStore.setList(
        await apiFetchExternalProviderAssetList(activeExternalProvider.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      handleError(error)
    } finally {
      externalProviderAssetListStore.hideLoader('hard')
    }
  }

  const resetAssetList = async () => {
    externalProviderAssetListStore.resetList()
    resetFilter(filter, pagination, fetchAssetList)
  }

  const fetchNextPage = async () => {
    const { maxAssetListItems } = useBetaTestFeatures()
    if (externalProviderAssetListStore.list.length >= maxAssetListItems.value) {
      showWarning('Maximum listing limit reached, please update your filter for better result.')
      return
    }
    if (!activeExternalProvider.value) return
    pagination.page = pagination.page + 1
    pagination.rowsPerPage = damConfigExtSystem.assetExternalProviders[activeExternalProvider.value].listingLimit
    try {
      externalProviderAssetListStore.showLoader('soft')
      externalProviderAssetListStore.appendList(
        await apiFetchExternalProviderAssetList(activeExternalProvider.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      handleError(error)
    } finally {
      externalProviderAssetListStore.hideLoader('soft')
    }
  }

  const filterTouch = () => {
    filterIsTouched.value = true
  }
  const filterUnTouch = () => {
    filterIsTouched.value = false
  }

  const showDetail = async (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (!activeExternalProvider.value) return
    externalProviderAssetListStore.keyboardNavigationEnable()
    externalProviderAssetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    assetDetailStore.showDetail()
    const res = await fetchExternalProviderAsset(activeExternalProvider.value, data.assetId)
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const onItemClick = async (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (isNull(activeExternalProvider.value)) return
    externalProviderAssetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    if (sidebarRight) sidebarRight.value = true
    const res = await fetchExternalProviderAsset(activeExternalProvider.value, data.assetId)
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

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
    if (selectedQueueTotalCount + selecting.length >= maxSelectedItems.value) {
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
    assetDetailStore.showLoader()
    const res = await fetchExternalProviderAsset(
      activeExternalProvider.value,
      externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex].asset.id
    )
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const prevItem = async () => {
    externalProviderAssetListStore.setActivePrev()
    if (isNull(externalProviderAssetListStore.activeItemIndex) || !activeExternalProvider.value) return
    assetDetailStore.showLoader()
    const res = await fetchExternalProviderAsset(
      activeExternalProvider.value,
      externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex].asset.id
    )
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const onArrowRight = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !externalProviderAssetListStore.keyboardNavigation) return
    await nextItem()
  }

  const onArrowLeft = async (event: KeyboardEvent) => {
    if (keyboardEventTargetIsAnyFormElement(event) || !externalProviderAssetListStore.keyboardNavigation) return
    await prevItem()
  }

  const totalCountText = computed(() => {
    const count = externalProviderAssetListStore.list.length
    return count > 0 ? count + (pagination.hasNextPage ? '+' : '') : '0'
  })

  const route = useRoute()
  const router = useRouter()
  const validateRouteProvider = async () => {
    if (!(isString(route.params.provider) && damConfigExtSystem.assetExternalProviders[route.params.provider])) {
      await router.push({ name: ROUTE.SYSTEM.NOT_FOUND })
      return
    }
    activeExternalProvider.value = route.params.provider
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
  }

  return {
    activeItemIndex,
    loader,
    items: list,
    pagination,
    filter,
    fetchAssetList,
    resetAssetList,
    fetchNextPage,
    filterIsTouched: readonly(filterIsTouched),
    filterTouch,
    filterUnTouch,
    listMounted,
    listUnmounted,
    showDetail,
    onItemClick,
    toggleSelected,
    selectMultiple,
    prevItem,
    nextItem,
    totalCountText,
    onArrowRight,
    onArrowLeft,
  }
}
