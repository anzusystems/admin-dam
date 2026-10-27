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
  /*
   * Tracks the active tile by asset, as in the asset list.
   * After a reload the same index may hold another asset or none.
   */
  let activeAssetId: AssetExternalProviderId | null = null
  /*
   * Set once a list came without that asset. No tile is active, and
   * the asset is awaited in a later page or the next list read.
   */
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

  /*
   * With no active tile, the previously active asset's tile becomes active again at its new index.
   * An awaited asset is awaited only while the side panel still shows it (`shownAssetId`).
   * Otherwise the panel may have lost it, and activating its tile would select something nobody picked.
   */
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
    // An asset missing from the first page of a re-read list can be on a later page.
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
    // The old active position now belongs to another asset or to none.
    activeItemIndex.value = null
    restoreActive(shownAssetId)
    activeAssetIsAwaited = isNull(activeItemIndex.value) && !isNull(activeAssetId)
  }

  function toggleSelectedByIndex(index: number) {
    if (!list.value[index]) return
    list.value[index].selected = !list.value[index].selected
  }

  /* Same rule `setList` applies: a row is selected exactly while its asset is in the mass-edit queue. */
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
    // The list may now be shorter than when the index was stored.
    if (!(oldActiveIndex in list.value)) return
    list.value[oldActiveIndex].active = false
  }

  function setActiveNext() {
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

  /** Empties the list before a re-read. No tile stays active, but the active asset is remembered. */
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
