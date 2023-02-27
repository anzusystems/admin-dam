import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetSearchListItemDto } from '@/types/coreDam/Asset'
import type { DocId } from '@anzusystems/common-admin'
import { isNull } from '@anzusystems/common-admin'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'
import { QueueItemType } from '@/types/coreDam/UploadQueue'

export type ListLoader = 'soft' | 'hard'

export interface AssetListItem {
  asset: AssetSearchListItemDto
  active: boolean
  selected: boolean
}

interface State {
  list: AssetListItem[]
  activeItemIndex: null | number
  keyboardNavigation: boolean
  loader: {
    soft: boolean
    hard: boolean
  }
}

export const useAssetListStore = defineStore('damAssetListStore', {
  state: (): State => ({
    list: [],
    activeItemIndex: null,
    keyboardNavigation: false,
    loader: {
      soft: false,
      hard: true,
    },
  }),
  actions: {
    showLoader(type: ListLoader = 'soft') {
      this.loader[type] = true
    },
    hideLoader(type: ListLoader = 'soft') {
      this.loader[type] = false
    },
    appendList(assets: AssetSearchListItemDto[], selectedItems: UploadQueueItem[] = []) {
      const selectedIds: Array<DocId> = []
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].type === QueueItemType.Asset && selectedItems[i].assetId) {
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
      this.list = this.list.concat(items)
    },
    setList(assets: AssetSearchListItemDto[], selectedItems: UploadQueueItem[] = []) {
      const selectedIds: Array<DocId> = []
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].type === QueueItemType.Asset && selectedItems[i].assetId) {
          selectedIds.push(selectedItems[i].assetId as DocId)
        }
      }
      this.list = assets.map((asset) => {
        return {
          asset: asset,
          active: false,
          selected: selectedIds.includes(asset.id),
        }
      })
    },
    setDeletingById(id: DocId) {
      const foundIndex = this.list.findIndex((item) => item.asset.id === id)
      if (foundIndex > -1) {
        this.list[foundIndex].asset.attributes.assetStatus = AssetStatus.Deleting
      }
    },
    toggleSelectedByIndex(index: number) {
      if (!this.list[index]) return
      this.list[index].selected = !this.list[index].selected
    },
    toggleSelectedByIds(ids: DocId[]) {
      this.list.forEach((item) => {
        if (ids.includes(item.asset.id)) {
          item.selected = !item.selected
        }
      })
    },
    setActiveByIndex(index: number) {
      const oldActiveIndex = this.activeItemIndex
      if (index === this.activeItemIndex) return
      if (!this.list[index]) return
      this.list[index].active = true
      this.activeItemIndex = index
      if (isNull(oldActiveIndex)) return
      this.list[oldActiveIndex].active = false
    },
    setActiveNext() {
      let activeIndex = 0
      if (!isNull(this.activeItemIndex)) {
        activeIndex = this.activeItemIndex
      }
      const wantedIndex = activeIndex + 1
      if (wantedIndex >= this.list.length) return
      this.setActiveByIndex(wantedIndex)
    },
    setActivePrev() {
      let activeIndex = 0
      if (!isNull(this.activeItemIndex)) {
        activeIndex = this.activeItemIndex
      }
      const wantedIndex = activeIndex - 1
      if (wantedIndex < 0) return
      this.setActiveByIndex(wantedIndex)
    },
    clearSelected() {
      this.list.forEach((item) => {
        item.selected = false
      })
    },
    keyboardNavigationEnable() {
      this.keyboardNavigation = true
    },
    keyboardNavigationDisable() {
      this.keyboardNavigation = false
    },
    resetList() {
      this.list = []
      this.loader.soft = false
      this.loader.hard = true
    },
    reset() {
      this.list = []
      this.activeItemIndex = null
      this.keyboardNavigation = false
      this.loader.soft = false
      this.loader.hard = true
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetListStore, import.meta.hot))
}
