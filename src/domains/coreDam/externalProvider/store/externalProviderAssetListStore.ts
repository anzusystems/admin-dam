import type { UploadQueueItem } from '@anzusystems/common-admin'
import { UploadQueueItemType } from '@anzusystems/common-admin'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import type { ListLoader } from '@/domains/coreDam/asset/store/assetListStore'

export interface ExternalProviderAssetListItem {
  asset: AssetExternalProviderListDto
  active: boolean
  selected: boolean
}

export const useExternalProviderAssetListStore = defineStore('damExternalProviderAssetListStore', () => {
  const list = ref<ExternalProviderAssetListItem[]>([])
  const activeItemIndex = ref<null | number>(null)
  const keyboardNavigation = ref(false)
  const loader = ref<{ soft: boolean; hard: boolean }>({
    soft: false,
    hard: true,
  })

  function showLoader(type: ListLoader = 'soft') {
    loader.value[type] = true
  }

  function hideLoader(type: ListLoader = 'soft') {
    loader.value[type] = false
  }

  function appendList(assets: AssetExternalProviderListDto[], selectedItems: UploadQueueItem[] = []) {
    const selectedIds: Array<AssetExternalProviderId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (
        selectedItems[i].type === UploadQueueItemType.ExternalProviderAsset &&
        selectedItems[i].externalProviderAssetId
      ) {
        selectedIds.push(selectedItems[i].externalProviderAssetId as AssetExternalProviderId)
      }
    }
    const items = assets.map((asset) => {
      return {
        asset: asset,
        active: false,
        selected: selectedIds.includes(asset.id),
      }
    })
    list.value = list.value.concat(items)
  }

  function setList(assets: AssetExternalProviderListDto[], selectedItems: UploadQueueItem[] = []) {
    const selectedIds: Array<AssetExternalProviderId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (
        selectedItems[i].type === UploadQueueItemType.ExternalProviderAsset &&
        selectedItems[i].externalProviderAssetId
      ) {
        selectedIds.push(selectedItems[i].externalProviderAssetId as AssetExternalProviderId)
      }
    }
    list.value = assets.map((asset) => {
      return {
        asset: asset,
        active: false,
        selected: selectedIds.includes(asset.id),
      }
    })
  }

  function toggleSelectedByIndex(index: number) {
    if (!list.value[index]) return
    list.value[index].selected = !list.value[index].selected
  }

  function toggleSelectedByIds(ids: AssetExternalProviderId[]) {
    list.value.forEach((item) => {
      if (ids.includes(item.asset.id)) {
        item.selected = !item.selected
      }
    })
  }

  function setActiveByIndex(index: number) {
    const oldActiveIndex = activeItemIndex.value
    if (index === activeItemIndex.value) return
    if (!list.value[index]) return
    list.value[index].active = true
    activeItemIndex.value = index
    if (isNull(oldActiveIndex)) return
    list.value[oldActiveIndex].active = false
  }

  function setActiveNext() {
    let activeIndex = 0
    if (!isNull(activeItemIndex.value)) {
      activeIndex = activeItemIndex.value
    }
    const wantedIndex = activeIndex + 1
    if (wantedIndex >= list.value.length) return
    setActiveByIndex(wantedIndex)
  }

  function setActivePrev() {
    let activeIndex = 0
    if (!isNull(activeItemIndex.value)) {
      activeIndex = activeItemIndex.value
    }
    const wantedIndex = activeIndex - 1
    if (wantedIndex < 0) return
    setActiveByIndex(wantedIndex)
  }

  function clearSelected() {
    list.value.forEach((item) => {
      item.selected = false
    })
  }

  function keyboardNavigationEnable() {
    keyboardNavigation.value = true
  }

  function keyboardNavigationDisable() {
    keyboardNavigation.value = false
  }

  function resetList() {
    list.value = []
    loader.value.soft = false
    loader.value.hard = true
  }

  function reset() {
    list.value = []
    activeItemIndex.value = null
    keyboardNavigation.value = false
    loader.value.soft = false
    loader.value.hard = true
  }

  return {
    list,
    activeItemIndex,
    keyboardNavigation,
    loader,
    showLoader,
    hideLoader,
    appendList,
    setList,
    toggleSelectedByIndex,
    toggleSelectedByIds,
    setActiveByIndex,
    setActiveNext,
    setActivePrev,
    clearSelected,
    keyboardNavigationEnable,
    keyboardNavigationDisable,
    resetList,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExternalProviderAssetListStore, import.meta.hot))
}
