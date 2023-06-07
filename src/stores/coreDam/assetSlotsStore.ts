import { acceptHMRUpdate, defineStore } from 'pinia'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { cloneDeep } from '@anzusystems/common-admin'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'

interface State {
  assetSlotNames: string[]
  list: Array<AssetSlot>
  loader: boolean
  // auth: Array<DistributionAuth>
}

export const useAssetSlotsStore = defineStore('damAssetSlotsStore', {
  state: (): State => ({
    assetSlotNames: [],
    list: [],
    loader: false,
    // auth: [],
  }),
  getters: {
    getPositionedSlots: (state) => {
      const data: Record<string, null | AssetSlot> = {}
      for (let i = 0; i < state.assetSlotNames.length; i++) {
        const found = state.list.find((item) => item.slotName === state.assetSlotNames[i])
        data[state.assetSlotNames[i]] = found ? found : null
      }
      return data
    },
  },
  actions: {
    showLoader() {
      this.loader = true
    },
    hideLoader() {
      this.loader = false
    },
    setAssetSlotsNamesFromConfig(assetType: AssetType) {
      this.assetSlotNames = cloneDeep(damConfigExtSystem[assetType].slots)
    },
    setList(items: Array<AssetSlot>) {
      this.list = items
    },
    reset() {
      this.list = []
      this.assetSlotNames = []
      this.loader = false
      // this.auth = []
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetSlotsStore, import.meta.hot))
}
