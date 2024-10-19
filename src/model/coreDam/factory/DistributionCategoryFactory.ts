import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import { DamAssetTypeDefault, dateTimeNow, type DamAssetTypeType } from '@anzusystems/common-admin'

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
