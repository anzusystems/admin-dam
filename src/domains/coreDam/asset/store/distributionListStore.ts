import { DamDistributionStatus, isNull } from '@anzusystems/common-admin'
import type { DamDistributionServiceName, DamDistributionStatusType, DocId } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import { fetchDistribution } from '@/domains/coreDam/asset/api/distributionApi'
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { DistributionAuthStatus } from '@/domains/coreDam/asset/types/DistributionAuth'
import type { DistributionAuth, DistributionAuthStatusType } from '@/domains/coreDam/asset/types/DistributionAuth'

export const useDistributionListStore = defineStore('damDistributionListStore', () => {
  const list = ref<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>([])
  // The asset the list is of: the store is one for the tabs of all assets.
  const listAssetId = ref<DocId | null>(null)
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

  /** Empties the list unless it is that asset's already: a read that fails must not leave another asset's there. */
  function listOfAsset(assetId: DocId) {
    if (listAssetId.value === assetId) return
    listAssetId.value = assetId
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

  return {
    list,
    listAssetId,
    loader,
    auth,
    getDistributionAuth,
    showLoader,
    hideLoader,
    setList,
    authorizationMessage,
    listItemMessageUpdate,
    setAuthStatus,
    listOfAsset,
    resetAuth,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionListStore, import.meta.hot))
}
