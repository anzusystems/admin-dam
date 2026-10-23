import type { UploadQueueItem } from '@anzusystems/common-admin'
import { UploadQueueItemType, isNull } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import type { ListLoader } from '@/domains/coreDam/asset/store/assetListStore'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'

export interface ExternalProviderAssetListItem {
  asset: AssetExternalProviderListDto
  active: boolean
  selected: boolean
}

export const useExternalProviderAssetListStore = defineStore('damExternalProviderAssetListStore', () => {
  const list = ref<ExternalProviderAssetListItem[]>([])
  const activeItemIndex = ref<null | number>(null)
  /* The asset of the active tile, as in the list of assets: the tile is active for its asset, not for its place, which
   * in a list read anew is another asset's or nobody's. */
  let activeAssetId: AssetExternalProviderId | null = null
  /* Of that asset, once a list came without it: no tile is active then, and the asset is only waited for, in a
   * further page or in the list read next. */
  let activeAssetIsAwaited = false
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

  /* With no tile active: the tile of the asset that was active is the active one again, at the place it has now. An
   * asset waited for is waited for only while the panel beside the list still shows it (`shownAssetId`): the panel
   * can lose it meanwhile, and a tile made active for it then would be one nobody picked. */
  function restoreActive(shownAssetId: AssetExternalProviderId | null) {
    if (!isNull(activeItemIndex.value) || isNull(activeAssetId)) return
    if (activeAssetIsAwaited && shownAssetId !== activeAssetId) {
      activeAssetId = null

      return
    }
    setActiveByIndex(list.value.findIndex((item) => item.asset.id === activeAssetId))
  }

  function appendList(
    assets: AssetExternalProviderListDto[],
    selectedItems: UploadQueueItem[] = [],
    shownAssetId: AssetExternalProviderId | null = null
  ) {
    const selectedIds: Array<AssetExternalProviderId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (
        selectedItems[i].type === UploadQueueItemType.ExternalProviderAsset &&
        selectedItems[i].externalProviderAssetId
      ) {
        selectedIds.push(selectedItems[i].externalProviderAssetId as AssetExternalProviderId)
      }
    }
    const items = assets.map((asset) => ({
      asset: asset,
      active: false,
      selected: selectedIds.includes(asset.id),
    }))
    list.value = list.value.concat(items)
    // The asset the first page of a list read anew did not bring can be in a further one.
    restoreActive(shownAssetId)
  }

  function setList(
    assets: AssetExternalProviderListDto[],
    selectedItems: UploadQueueItem[] = [],
    shownAssetId: AssetExternalProviderId | null = null
  ) {
    const selectedIds: Array<AssetExternalProviderId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (
        selectedItems[i].type === UploadQueueItemType.ExternalProviderAsset &&
        selectedItems[i].externalProviderAssetId
      ) {
        selectedIds.push(selectedItems[i].externalProviderAssetId as AssetExternalProviderId)
      }
    }
    list.value = assets.map((asset) => ({
      asset: asset,
      active: false,
      selected: selectedIds.includes(asset.id),
    }))
    // The place the active tile had is another asset's in these rows, or nobody's.
    activeItemIndex.value = null
    restoreActive(shownAssetId)
    activeAssetIsAwaited = isNull(activeItemIndex.value) && !isNull(activeAssetId)
  }

  function toggleSelectedByIndex(index: number) {
    if (!list.value[index]) return
    list.value[index].selected = !list.value[index].selected
  }

  /* The whole list against one set of ids, the same rule `setList` applies when it builds the rows:
   * a row is selected exactly while its asset is in the mass-edit queue. */
  function setSelectedByIds(ids: AssetExternalProviderId[]) {
    list.value.forEach((item) => {
      item.selected = ids.includes(item.asset.id)
    })
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
    activeAssetId = list.value[index].asset.id
    activeAssetIsAwaited = false
    if (isNull(oldActiveIndex)) return
    // The list may be shorter than the one the place was in.
    if (!(oldActiveIndex in list.value)) return
    list.value[oldActiveIndex].active = false
  }

  function setActiveNext() {
    // With no tile active the next one is the first.
    const wantedIndex = isNull(activeItemIndex.value) ? 0 : activeItemIndex.value + 1
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

  /** The list is emptied to be read anew: no tile is left to be active, and the asset that was is remembered. */
  function resetList() {
    list.value = []
    activeItemIndex.value = null
    loader.value.soft = false
    loader.value.hard = true
  }

  function reset() {
    list.value = []
    activeItemIndex.value = null
    activeAssetId = null
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
    setSelectedByIds,
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
