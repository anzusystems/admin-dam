import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'

export function useDistributionCategoryFactory() {
  const createDefault = (extSystemId: number, type?: AssetType): DistributionCategory => {
    return {
      id: '',
      name: '',
      type: type ?? AssetType.Default,
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
