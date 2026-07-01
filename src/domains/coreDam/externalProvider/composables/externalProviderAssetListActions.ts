import { useDamConfigState } from '@anzusystems/common-admin'
import { useFilterHelpers, usePagination } from '@anzusystems/common-admin/labs'
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
  const { resetFilter } = useFilterHelpers(filterData, filterConfig)
  const { executeFetch } = useFetchExternalProviderAssetList()
  const { executeRequest: fetchExternalProviderAsset } = useFetchExternalProviderAsset()
  const { maxSelectedItems } = useBetaTestFeatures()
  const { list, loader, activeItemIndex } = storeToRefs(externalProviderAssetListStore)

  const fetchAssetList = async () => {
    if (!activeExternalProvider.value) return
    pagination.value.page = 1
    pagination.value.rowsPerPage =
      configExtSystem.assetExternalProviders?.[activeExternalProvider.value]?.listingLimit ?? 10
    try {
      externalProviderAssetListStore.showLoader('hard')
      externalProviderAssetListStore.setList(
        await executeFetch(pagination, filterData, filterConfig, {
          urlParams: { externalProvider: activeExternalProvider.value },
        }),
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
    resetFilter(pagination, fetchAssetList)
  }

  const fetchNextPage = async () => {
    const { maxAssetListItems } = useBetaTestFeatures()
    if (externalProviderAssetListStore.list.length >= maxAssetListItems.value) {
      showWarning('Maximum listing limit reached, please update your filter for better result.')
      return
    }
    if (!activeExternalProvider.value) return
    pagination.value.page = pagination.value.page + 1
    pagination.value.rowsPerPage =
      configExtSystem.assetExternalProviders?.[activeExternalProvider.value]?.listingLimit ?? 10
    try {
      externalProviderAssetListStore.showLoader('soft')
      externalProviderAssetListStore.appendList(
        await executeFetch(pagination, filterData, filterConfig, {
          urlParams: { externalProvider: activeExternalProvider.value },
        }),
        uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
      )
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      externalProviderAssetListStore.hideLoader('soft')
    }
  }

  const showDetail = async (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (!activeExternalProvider.value) return
    externalProviderAssetListStore.keyboardNavigationEnable()
    externalProviderAssetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    assetDetailStore.showDetail()
    const res = await fetchExternalProviderAsset({
      urlParams: { externalProvider: activeExternalProvider.value, id: data.assetId },
    })
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const onItemClick = async (data: { assetId: AssetExternalProviderId; index: number }) => {
    if (isNull(activeExternalProvider.value)) return
    externalProviderAssetListStore.setActiveByIndex(data.index)
    assetDetailStore.showLoader()
    if (sidebarRight) sidebarRight.value = true
    const res = await fetchExternalProviderAsset({
      urlParams: { externalProvider: activeExternalProvider.value, id: data.assetId },
    })
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
    const res = await fetchExternalProviderAsset({
      urlParams: {
        externalProvider: activeExternalProvider.value,
        id: externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex].asset.id,
      },
    })
    assetDetailStore.setAsset(res)
    assetDetailStore.hideLoader()
  }

  const prevItem = async () => {
    externalProviderAssetListStore.setActivePrev()
    if (isNull(externalProviderAssetListStore.activeItemIndex) || !activeExternalProvider.value) return
    assetDetailStore.showLoader()
    const res = await fetchExternalProviderAsset({
      urlParams: {
        externalProvider: activeExternalProvider.value,
        id: externalProviderAssetListStore.list[externalProviderAssetListStore.activeItemIndex].asset.id,
      },
    })
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
