import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetSearchListItemDto, DocId, UploadQueueItem } from '@anzusystems/common-admin'
import { DamAssetStatus, isNull, UploadQueueItemType } from '@anzusystems/common-admin'
import { ref } from 'vue'

export type ListLoader = 'soft' | 'hard'

export interface AssetListItem {
  asset: AssetSearchListItemDto
  active: boolean
  selected: boolean
}

export const useAssetListStore = defineStore('damAssetListStore', () => {
  const list = ref<AssetListItem[]>([])
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

  function appendList(assets: AssetSearchListItemDto[], selectedItems: UploadQueueItem[] = []) {
    const selectedIds: Array<DocId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i].type === UploadQueueItemType.Asset && selectedItems[i].assetId) {
        selectedIds.push(selectedItems[i].assetId as DocId)
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

  function setList(assets: AssetSearchListItemDto[], selectedItems: UploadQueueItem[] = []) {
    const selectedIds: Array<DocId> = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i].type === UploadQueueItemType.Asset && selectedItems[i].assetId) {
        selectedIds.push(selectedItems[i].assetId as DocId)
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

  function setDeletingById(id: DocId) {
    const foundIndex = list.value.findIndex((item) => item.asset.id === id)
    if (foundIndex > -1) {
      list.value[foundIndex].asset.attributes.assetStatus = DamAssetStatus.Deleting
    }
  }

  function toggleSelectedByIndex(index: number) {
    if (!list.value[index]) return
    list.value[index].selected = !list.value[index].selected
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
    setDeletingById,
    toggleSelectedByIndex,
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
