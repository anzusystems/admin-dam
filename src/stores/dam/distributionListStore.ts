import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceName } from '@/types/dam/DamConfig'
import type { DocId } from '@anzusystems/common-admin'
import { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'
import { fetchDistribution } from '@/services/api/dam/distributionApi'
import type { DistributionAuth } from '@/types/dam/DistributionAuth'
import { DistributionAuthStatus } from '@/types/dam/DistributionAuth'
import { isNull } from '@anzusystems/common-admin'

interface State {
  list: Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>
  loader: boolean
  auth: Array<DistributionAuth>
}

export const useDistributionListStore = defineStore('damDistributionListStore', {
  state: (): State => ({
    list: [],
    loader: false,
    auth: [],
  }),
  getters: {
    getDistributionAuth: (state) => {
      return (distributionService: DistributionServiceName) => {
        const foundIndex = state.auth.findIndex((item) => item.distributionService === distributionService)
        if (foundIndex > -1) return state.auth[foundIndex]
        return null
      }
    },
  },
  actions: {
    showLoader() {
      this.loader = true
    },
    hideLoader() {
      this.loader = false
    },
    setList(items: Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>) {
      this.list = items
    },
    authorizationMessage(distributionService: DistributionServiceName, success: boolean) {
      const found = this.getDistributionAuth(distributionService)
      if (found) {
        found.status = success ? DistributionAuthStatus.Success : DistributionAuthStatus.Error
        return
      }
      this.auth.push({
        distributionService,
        status: success ? DistributionAuthStatus.Success : DistributionAuthStatus.Error,
      })
    },
    async listItemMessageUpdate(distributionId: DocId, status: DistributionStatus) {
      switch (status) {
        case DistributionStatus.Distributing:
        case DistributionStatus.RemoteProcessing:
          {
            const foundIndex = this.list.findIndex((item) => item.id === distributionId)
            if (foundIndex > -1) {
              this.list[foundIndex].status = status
            }
          }
          break
        default:
          try {
            const res = await fetchDistribution(distributionId)
            const foundIndex = this.list.findIndex((item) => item.id === res.id)
            if (foundIndex > -1) {
              this.list.splice(foundIndex, 1, res)
            }
          } catch (error) {
            //
          }
      }
    },
    setAuthStatus(distributionService: DistributionServiceName, status = DistributionAuthStatus.Idle) {
      const authItem = this.getDistributionAuth(distributionService)
      if (authItem) {
        authItem.status = status
        return
      }
      this.auth.push({ distributionService, status: status })
    },
    resetList() {
      this.list = []
    },
    resetAuth(distributionService: DistributionServiceName | null = null) {
      if (isNull(distributionService)) {
        this.auth = []
        return
      }
      const foundIndex = this.auth.findIndex((item) => item.distributionService === distributionService)
      if (foundIndex > -1) {
        this.auth.splice(foundIndex, 1)
      }
    },
    reset() {
      this.list = []
      this.loader = false
      this.auth = []
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionListStore, import.meta.hot))
}
