import type { DamDistributionServiceTypeType, DocIdNullable } from '@anzusystems/common-admin'
import { ref } from 'vue'

const dialogCancel = ref(false)
const distributionIdToCancel = ref<DocIdNullable>(null)
const distributionTypeToCancel = ref<DamDistributionServiceTypeType | null>(null)

export function useAssetDetailDistributionDialogCancel() {
  const openCancel = (id: DocIdNullable, type: DamDistributionServiceTypeType) => {
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
