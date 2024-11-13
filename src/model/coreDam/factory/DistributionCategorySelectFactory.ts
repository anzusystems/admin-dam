import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import { DamAssetTypeDefault, dateTimeNow } from '@anzusystems/common-admin'

export function useDistributionCategorySelectFactory() {
  const createDefault = (extSystemId: number): DistributionCategorySelect => {
    return {
      id: '',
      serviceSlug: '',
      type: DamAssetTypeDefault,
      extSystem: extSystemId,
      options: [],
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
