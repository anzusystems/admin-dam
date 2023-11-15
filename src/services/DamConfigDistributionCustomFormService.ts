import { type Ref, ref } from 'vue'
import { fetchDistributionCustomFormElements } from '@/services/api/coreDam/assetCustomFormApi'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export const damConfigDistributionCustomFormElements: Ref<Record<DamDistributionServiceName, any>> = ref({})

export const loadDamConfigDistributionCustomFormElements = (distributionServiceName: DamDistributionServiceName) => {
  return new Promise((resolve, reject) => {
    if (damConfigDistributionCustomFormElements.value[distributionServiceName]) {
      resolve(true)
      return
    }
    fetchDistributionCustomFormElements(distributionServiceName)
      .then((res) => {
        damConfigDistributionCustomFormElements.value[distributionServiceName] = res.data
        resolve(true)
        return
      })
      .catch((error) => {
        reject(error)
        return
      })
  })
}
