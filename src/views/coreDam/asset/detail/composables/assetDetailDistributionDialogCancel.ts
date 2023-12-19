import { ref } from 'vue'
import type { DamDistributionServiceType, DocIdNullable } from '@anzusystems/common-admin'

const dialogCancel = ref(false)
const distributionIdToCancel = ref<DocIdNullable>(null)
const distributionTypeToCancel = ref<DamDistributionServiceType | null>(null)

export function useAssetDetailDistributionDialogCancel() {
  const openCancel = (id: DocIdNullable, type: DamDistributionServiceType) => {
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
