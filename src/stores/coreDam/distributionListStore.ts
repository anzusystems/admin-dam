import { fetchDistribution } from '@/services/api/coreDam/distributionApi'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import {
  type DistributionAuth,
  DistributionAuthStatus,
  type DistributionAuthStatusType,
} from '@/types/coreDam/DistributionAuth'
import type { DamDistributionStatusType, DocId } from '@anzusystems/common-admin'
import { type DamDistributionServiceName, DamDistributionStatus, isNull } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const useDistributionListStore = defineStore('damDistributionListStore', () => {
  const list = ref<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>([])
  const loader = ref(false)
  const auth = ref<Array<DistributionAuth>>([])

  function getDistributionAuth(distributionService: DamDistributionServiceName) {
    const foundIndex = auth.value.findIndex((item) => item.distributionService === distributionService)
    if (foundIndex > -1) return auth.value[foundIndex]
    return null
  }

  function showLoader() {
    loader.value = true
  }

  function hideLoader() {
    loader.value = false
  }

  function setList(items: Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>) {
    list.value = items
  }

  function authorizationMessage(distributionService: DamDistributionServiceName, success: boolean) {
    const found = getDistributionAuth(distributionService)
    if (found) {
      found.status = success ? DistributionAuthStatus.Success : DistributionAuthStatus.Error
      return
    }
    auth.value.push({
      distributionService,
      status: success ? DistributionAuthStatus.Success : DistributionAuthStatus.Error,
    })
  }

  async function listItemMessageUpdate(distributionId: DocId, status: DamDistributionStatusType) {
    switch (status) {
      case DamDistributionStatus.Distributing:
      case DamDistributionStatus.RemoteProcessing:
        {
          const foundIndex = list.value.findIndex((item) => item.id === distributionId)
          if (foundIndex > -1) {
            list.value[foundIndex].status = status
          }
        }
        break
      default:
        try {
          const res = await fetchDistribution(distributionId)
          const foundIndex = list.value.findIndex((item) => item.id === res.id)
          if (foundIndex > -1) {
            list.value.splice(foundIndex, 1, res)
          }
        } catch (error) {
          //
        }
    }
  }

  function setAuthStatus(
    distributionService: DamDistributionServiceName,
    status: DistributionAuthStatusType = DistributionAuthStatus.Idle
  ) {
    const authItem = getDistributionAuth(distributionService)
    if (authItem) {
      authItem.status = status
      return
    }
    auth.value.push({ distributionService, status: status })
  }

  function resetList() {
    list.value = []
  }

  function resetAuth(distributionService: DamDistributionServiceName | null = null) {
    if (isNull(distributionService)) {
      auth.value = []
      return
    }
    const foundIndex = auth.value.findIndex((item) => item.distributionService === distributionService)
    if (foundIndex > -1) {
      auth.value.splice(foundIndex, 1)
    }
  }

  function reset() {
    list.value = []
    loader.value = false
    auth.value = []
  }

  return {
    list,
    loader,
    auth,
    getDistributionAuth,
    showLoader,
    hideLoader,
    setList,
    authorizationMessage,
    listItemMessageUpdate,
    setAuthStatus,
    resetList,
    resetAuth,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionListStore, import.meta.hot))
}
