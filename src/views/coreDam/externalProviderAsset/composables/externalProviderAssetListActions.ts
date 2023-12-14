import {
  isNull,
  isString, isUndefined,
  useAlerts,
  useDamConfigState,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { useExternalProviderAssetListFilter } from '@/model/coreDam/filter/ExternalProviderAssetFilter'
import { storeToRefs } from 'pinia'
import {
  fetchExternalProviderAsset,
  fetchExternalProviderAssetList as apiFetchExternalProviderAssetList,
} from '@/services/api/coreDam/externalProviderAssetApi'
import { useExternalProviders } from '@/composables/system/externalProviders'
import { useExternalProviderAssetListStore } from '@/stores/coreDam/externalProviderAssetListStore'
import { readonly, type Ref, ref } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/coreDam/AssetExternalProvider'
import { useExternalProviderAssetDetailStore } from '@/stores/coreDam/externalProviderAssetDetailStore'
import { ROUTE } from '@/router/routes'
import { useRoute, useRouter } from 'vue-router'
import { keyboardEventTargetIsAnyFormElement } from '@/utils/event'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const { showWarning, showErrorsDefault } = useAlerts()

const filter = useExternalProviderAssetListFilter()
const pagination = usePagination()
const { activeExternalProvider } = useExternalProviders()

const filterIsTouched = ref(false)

export function useExternalProviderAssetListActions(sidebarRight: Ref<boolean> | null = null) {
  const { getDamConfigExtSystem } = useDamConfigState()
  const { currentExtSystemId } = useCurrentExtSystem()
  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }
  const assetDetailStore = useExternalProviderAssetDetailStore()
  const externalProviderAssetListStore = useExternalProviderAssetListStore()
  const uploadQueuesStore = useUploadQueuesStore()
  const { resetFilter } = useFilterHelpers()
  const { maxSelectedItems } = useBetaTestFeatures()
  const { list, loader, activeItemIndex } = storeToRefs(externalProviderAssetListStore)

  const fetchAssetList = async () => {
    if (!activeExternalProvider.value) return
    pagination.page = 1
    pagination.rowsPerPage = configExtSystem.assetExternalProviders[activeExternalProvider.value].listingLimit
    try {
      externalProviderAssetListStore.showLoader('hard')
      externalProviderAssetListStore.setList(
        await apiFetchExternalProviderAssetList(activeExternalProvider.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      showErrorsDefault(error)
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
    pagination.rowsPerPage = configExtSystem.assetExternalProviders[activeExternalProvider.value].listingLimit
    try {
      externalProviderAssetListStore.showLoader('soft')
      externalProviderAssetListStore.appendList(
        await apiFetchExternalProviderAssetList(activeExternalProvider.value, pagination, filter),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      showErrorsDefault(error)
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

  const route = useRoute()
  const router = useRouter()
  const validateRouteProvider = async () => {
    if (!(isString(route.params.provider) && configExtSystem.assetExternalProviders[route.params.provider])) {
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
    onArrowRight,
    onArrowLeft,
  }
}
