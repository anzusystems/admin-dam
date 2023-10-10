import { type Ref, ref } from 'vue'
import { fetchDistributionCustomFormElements } from '@/services/api/coreDam/assetCustomFormApi'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import { mapElementsWithKeyToProperty } from '@/services/TempMapCustomFormElementHelper'

export const damConfigDistributionCustomFormElements: Ref<Record<DistributionServiceName, any>> = ref({})

export const loadDamConfigDistributionCustomFormElements = (distributionServiceName: DistributionServiceName) => {
  return new Promise((resolve, reject) => {
    if (damConfigDistributionCustomFormElements.value[distributionServiceName]) {
      resolve(true)
      return
    }
    fetchDistributionCustomFormElements(distributionServiceName)
      .then((res) => {
        damConfigDistributionCustomFormElements.value[distributionServiceName] = mapElementsWithKeyToProperty(res.data)
        resolve(true)
        return
      })
      .catch((error) => {
        reject(error)
        return
      })
  })
}
