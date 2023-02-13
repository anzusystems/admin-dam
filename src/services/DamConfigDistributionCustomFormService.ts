import { type Ref, ref } from 'vue'
import { fetchDistributionCustomFormElements } from '@/services/api/dam/assetCustomFormApi'
import type { DistributionServiceName } from '@/types/dam/DamConfig'

export const damConfigDistributionCustomFormElements: Ref<Record<DistributionServiceName, any>> = ref({})

export const loadDamConfigDistributionCustomFormElements = (distributionServiceName: DistributionServiceName) => {
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
