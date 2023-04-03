import { ref } from 'vue'
import type { DocIdNullable } from '@anzusystems/common-admin'
import type { DistributionServiceType } from '@/types/coreDam/DamConfig'

const dialogCancel = ref(false)
const distributionIdToCancel = ref<DocIdNullable>(null)
const distributionTypeToCancel = ref<DistributionServiceType | null>(null)

export function useAssetDetailDistributionDialogCancel() {
  const openCancel = (id: DocIdNullable, type: DistributionServiceType) => {
    distributionTypeToCancel.value = type
    distributionIdToCancel.value = id
    dialogCancel.value = true
  }

  return {
    distributionIdToCancel,
    distributionTypeToCancel,
    openCancel,
    dialogCancel,
  }
}
