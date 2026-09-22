import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'
import { DamAssetTypeDefault } from '@anzusystems/common-admin'

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
