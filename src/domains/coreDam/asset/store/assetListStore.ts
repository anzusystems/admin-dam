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
  /* The asset of the active tile. The tile is active for its asset, not for its place: in a list read anew the place
   * is another asset's. Not the asset the panel beside the list holds, which can be one of a queue row, or the one
   * before while a read is on its way. */
  let activeAssetId: DocId | null = null
  /* Which of its tiles it was, counted from the first, for an asset the list holds more than once: the pages of a list
   * can bring it twice. */
  let activeAssetTile = 0
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
   * can lose it or take another meanwhile, and a tile made active for it then would be one nobody picked. */
  function restoreActive(shownAssetId: DocId | null) {
    if (!isNull(activeItemIndex.value) || isNull(activeAssetId)) return
    if (activeAssetIsAwaited && shownAssetId !== activeAssetId) {
      activeAssetId = null

      return
    }
    const tiles = list.value.flatMap((item, index) => (item.asset.id === activeAssetId ? [index] : []))
    setActiveByIndex(tiles[activeAssetTile] ?? tiles[0] ?? -1)
  }

  /* A tile of an asset deleted here is drawn as being deleted whenever the list takes it: a read sent before the delete
   * and answered after it - a further page, or the first one of a list read anew - brings the status from before. */
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
    const items = assets.map((asset) => {
      return {
        asset: markedIfDeletedHere(asset),
        active: false,
        selected: selectedIds.includes(asset.id),
      }
    })
    list.value = list.value.concat(items)
    // The asset the first page of a list read anew did not bring can be in a further one.
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
    list.value = assets.map((asset) => {
      return {
        asset: markedIfDeletedHere(asset),
        active: false,
        selected: selectedIds.includes(asset.id),
      }
    })
    // The place the active tile had is another asset's in these rows, or nobody's.
    activeItemIndex.value = null
    restoreActive(shownAssetId)
    activeAssetIsAwaited = isNull(activeItemIndex.value) && !isNull(activeAssetId)
  }

  // Every tile of the asset: a page read after another one can bring the same asset again.
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
