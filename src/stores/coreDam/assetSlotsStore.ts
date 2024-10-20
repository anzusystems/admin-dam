import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { cloneDeep, type DamAssetTypeType, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'

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
    setAssetSlotsNamesFromConfig(assetType: DamAssetTypeType) {
      const { getDamConfigExtSystem } = useDamConfigState(damClient)
      const { currentExtSystemId } = useCurrentExtSystem()
      const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
      if (isUndefined(configExtSystem)) {
        throw new Error('Ext system must be initialised.')
      }
      this.assetSlotNames = cloneDeep(configExtSystem[assetType].slots)
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
