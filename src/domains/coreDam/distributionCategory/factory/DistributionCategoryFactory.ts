import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategory/api/distributionCategoryApi'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import { DamAssetTypeDefault, type DamAssetTypeType } from '@anzusystems/common-admin'

export function useDistributionCategoryFactory() {
  const createDefault = (extSystemId: number, type?: DamAssetTypeType): DistributionCategory => {
    return {
      id: '',
      name: '',
      type: type ?? DamAssetTypeDefault,
      extSystem: extSystemId,
      selectedOptions: [],
      selectedOptionsDetail: [],
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
