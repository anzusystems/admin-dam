import type { AssetSearchListItemDto, DocId, UploadQueueItem } from '@anzusystems/common-admin'
import { DamAssetStatus, UploadQueueItemType, isNull } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import { assetDeletedHere } from '@/domains/coreDam/asset/api/assetApi'

export type ListLoader = 'soft' | 'hard'

export interface AssetListItem {
  asset: AssetSearchListItemDto
  active: boolean
  selected: boolean
}

export const useAssetListStore = defineStore('damAssetListStore', () => {
  const list = ref<AssetListItem[]>([])
  const activeItemIndex = ref<null | number>(null)
  /*
   * Asset of the active tile. Tracked by asset, not position,
   * because a re-read list puts another asset at that position.
   * Not the asset in the side panel, which can come from a queue row or be the previous one while a read is pending.
   */
  let activeAssetId: DocId | null = null
  /* Index of the active tile among that asset's tiles. List pages can bring the same asset twice. */
  let activeAssetTile = 0
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
   * With no tile active, reactivate the previously active asset's tile at its new position.
   * An awaited asset is restored only while the side panel still shows it
   * (`shownAssetId`). Otherwise the restored tile would be one nobody picked.
   */
  function restoreActive(shownAssetId: DocId | null) {
    if (!isNull(activeItemIndex.value) || isNull(activeAssetId)) return
    if (activeAssetIsAwaited && shownAssetId !== activeAssetId) {
      activeAssetId = null

      return
    }
    const tiles = list.value.flatMap((item, index) => (item.asset.id === activeAssetId ? [index] : []))
    setActiveByIndex(tiles[activeAssetTile] ?? tiles[0] ?? -1)
  }

  /*
   * Keep a tile of an asset deleted here drawn as deleting.
   * A read sent before the delete and answered after it (later page or re-read first page) brings the old status.
   */
  const markedIfDeletedHere = (asset: AssetSearchListItemDto) => {
    if (assetDeletedHere(asset.id)) asset.attributes.assetStatus = DamAssetStatus.Deleting

    return asset
  }

  function appendList(
    assets: AssetSearchListItemDto[],
    selectedItems: UploadQueueItem[] = [],
    shownAssetId: DocId | null = null
  ) {
    const selectedIds: Array<DocId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i].type === UploadQueueItemType.Asset && selectedItems[i].assetId) {
        selectedIds.push(selectedItems[i].assetId as DocId)
      }
    }
    const items = assets.map((asset) => ({
      asset: markedIfDeletedHere(asset),
      active: false,
      selected: selectedIds.includes(asset.id),
    }))
    list.value = list.value.concat(items)
    // An asset missing from the first page of a re-read list can be on a later page.
    restoreActive(shownAssetId)
  }

  function setList(
    assets: AssetSearchListItemDto[],
    selectedItems: UploadQueueItem[] = [],
    shownAssetId: DocId | null = null
  ) {
    const selectedIds: Array<DocId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i].type === UploadQueueItemType.Asset && selectedItems[i].assetId) {
        selectedIds.push(selectedItems[i].assetId as DocId)
      }
    }
    list.value = assets.map((asset) => ({
      asset: markedIfDeletedHere(asset),
      active: false,
      selected: selectedIds.includes(asset.id),
    }))
    // The old active position now belongs to another asset or to none.
    activeItemIndex.value = null
    restoreActive(shownAssetId)
    activeAssetIsAwaited = isNull(activeItemIndex.value) && !isNull(activeAssetId)
  }

  // Update every tile of the asset: a later page can bring the same asset again.
  function setDeletingById(id: DocId) {
    list.value.forEach((item) => {
      if (item.asset.id === id) item.asset.attributes.assetStatus = DamAssetStatus.Deleting
    })
  }

  function toggleSelectedByIndex(index: number) {
    if (!list.value[index]) return
    list.value[index].selected = !list.value[index].selected
  }

  /* The same rule `setList` applies when it builds the rows: a row is selected exactly while its asset is in the
   * mass-edit queue. */
  function setSelectedByIds(ids: DocId[]) {
    list.value.forEach((item) => {
      item.selected = ids.includes(item.asset.id)
    })
  }

  function toggleSelectedByIds(ids: DocId[]) {
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
    activeAssetTile = list.value.slice(0, index).filter((item) => item.asset.id === activeAssetId).length
    activeAssetIsAwaited = false
    if (isNull(oldActiveIndex)) return
    if (!(oldActiveIndex in list.value)) return
    list.value[oldActiveIndex].active = false
  }

  function getActiveAsset() {
    const activeIndex = activeItemIndex.value

    if (isNull(activeIndex)) return null
    if (!list.value[activeIndex]) return null
    return list.value[activeIndex]
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
    setDeletingById,
    toggleSelectedByIndex,
    setSelectedByIds,
    toggleSelectedByIds,
    setActiveByIndex,
    getActiveAsset,
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
  import.meta.hot.accept(acceptHMRUpdate(useAssetListStore, import.meta.hot))
}
