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
  // The asset the list belongs to. The store is shared by the tabs of all assets.
  const listAssetId = ref<DocId | null>(null)
  const loader = ref(false)
  const auth = ref<Array<DistributionAuth>>([])
  /*
   * Loader raise count. Raised by a tab read or a delete in its settings, and lowered only by the latest raiser.
   * Previously a delete answered during a reopened tab's read hid the loader under that read.
   */
  let loaderRaised = 0
  /*
   * Distributions deleted or stopped here. A read sent before that
   * would bring them back, so the list never takes them again.
   */
  const gone = new Set<DocId>()

  function getDistributionAuth(distributionService: DamDistributionServiceName) {
    const foundIndex = auth.value.findIndex((item) => item.distributionService === distributionService)
    if (foundIndex > -1) return auth.value[foundIndex]
    return null
  }

  /**
   * Returns the raise count to pass to `hideLoader`.
   */
  function showLoader() {
    loader.value = true

    return ++loaderRaised
  }

  /**
   * Lowered only when `raised` (from `showLoader`) is the latest raise.
   */
  function hideLoader(raised: number) {
    if (raised !== loaderRaised) return
    loader.value = false
  }

  function setList(items: Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>) {
    list.value = items.filter((item) => !gone.has(item.id))
  }

  /**
   * Removes the distribution if listed; the list may belong to another asset by now.
   * A deleted or stopped distribution is excluded for good.
   */
  function removeListItem(distributionId: DocId) {
    gone.add(distributionId)
    const foundIndex = list.value.findIndex((item) => item.id === distributionId)
    if (foundIndex > -1) {
      list.value.splice(foundIndex, 1)
    }
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

  /**
   * Empties the list unless it already belongs to that asset, so a failed read does not leave another asset's list.
   */
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
    removeListItem,
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
