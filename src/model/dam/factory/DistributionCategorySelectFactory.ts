import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/types/dam/DistributionCategorySelect'
import { AssetType } from '@/model/dam/valueObject/AssetType'

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
