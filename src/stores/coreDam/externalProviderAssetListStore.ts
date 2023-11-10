import { acceptHMRUpdate, defineStore } from 'pinia'
import type { UploadQueueItem } from '@anzusystems/common-admin'
import { isNull, UploadQueueItemType } from '@anzusystems/common-admin'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/coreDam/AssetExternalProvider'
import type { ListLoader } from '@/stores/coreDam/assetListStore'

export interface ExternalProviderAssetListItem {
  asset: AssetExternalProviderListDto
  active: boolean
  selected: boolean
}

interface State {
  list: ExternalProviderAssetListItem[]
  activeItemIndex: null | number
  keyboardNavigation: boolean
  loader: {
    soft: boolean
    hard: boolean
  }
}

export const useExternalProviderAssetListStore = defineStore('damExternalProviderAssetListStore', {
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
    appendList(assets: AssetExternalProviderListDto[], selectedItems: UploadQueueItem[] = []) {
      const selectedIds: Array<AssetExternalProviderId> = []
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].type === UploadQueueItemType.ExternalProviderAsset && selectedItems[i].externalProviderAssetId) {
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
      this.list = this.list.concat(items)
    },
    setList(assets: AssetExternalProviderListDto[], selectedItems: UploadQueueItem[] = []) {
      const selectedIds: Array<AssetExternalProviderId> = []
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].type === UploadQueueItemType.ExternalProviderAsset && selectedItems[i].externalProviderAssetId) {
          selectedIds.push(selectedItems[i].externalProviderAssetId as AssetExternalProviderId)
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
    toggleSelectedByIndex(index: number) {
      if (!this.list[index]) return
      this.list[index].selected = !this.list[index].selected
    },
    toggleSelectedByIds(ids: AssetExternalProviderId[]) {
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
  import.meta.hot.accept(acceptHMRUpdate(useExternalProviderAssetListStore, import.meta.hot))
}
