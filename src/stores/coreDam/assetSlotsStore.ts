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
    // authorizationMessage(distributionService: DistributionServiceName, success: boolean) {
    //   const found = this.getDistributionAuth(distributionService)
    //   if (found) {
    //     found.status = success ? DistributionAuthStatus.Success : DistributionAuthStatus.Error
    //     return
    //   }
    //   this.auth.push({
    //     distributionService,
    //     status: success ? DistributionAuthStatus.Success : DistributionAuthStatus.Error,
    //   })
    // },
    // async listItemMessageUpdate(distributionId: DocId, status: DistributionStatus) {
    //   switch (status) {
    //     case DistributionStatus.Distributing:
    //     case DistributionStatus.RemoteProcessing:
    //       {
    //         const foundIndex = this.list.findIndex((item) => item.id === distributionId)
    //         if (foundIndex > -1) {
    //           this.list[foundIndex].status = status
    //         }
    //       }
    //       break
    //     default:
    //       try {
    //         const res = await fetchDistribution(distributionId)
    //         const foundIndex = this.list.findIndex((item) => item.id === res.id)
    //         if (foundIndex > -1) {
    //           this.list.splice(foundIndex, 1, res)
    //         }
    //       } catch (error) {
    //         //
    //       }
    //   }
    // },
    // setAuthStatus(distributionService: DistributionServiceName, status = DistributionAuthStatus.Idle) {
    //   const authItem = this.getDistributionAuth(distributionService)
    //   if (authItem) {
    //     authItem.status = status
    //     return
    //   }
    //   this.auth.push({ distributionService, status: status })
    // },
    // resetList() {
    //   this.list = []
    // },
    // resetAuth(distributionService: DistributionServiceName | null = null) {
    //   if (isNull(distributionService)) {
    //     this.auth = []
    //     return
    //   }
    //   const foundIndex = this.auth.findIndex((item) => item.distributionService === distributionService)
    //   if (foundIndex > -1) {
    //     this.auth.splice(foundIndex, 1)
    //   }
    // },
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
