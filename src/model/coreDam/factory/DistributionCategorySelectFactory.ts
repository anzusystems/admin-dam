import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'

export function useDistributionCategorySelectFactory() {
  const createDefault = (extSystemId: number): DistributionCategorySelect => {
    return {
      id: '',
      serviceSlug: '',
      type: AssetType.Default,
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