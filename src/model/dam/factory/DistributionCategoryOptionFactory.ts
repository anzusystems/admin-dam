import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'

export function useDistributionCategoryOptionFactory() {
  const createDefault = (distributionCategorySelectId: string): DistributionCategoryOption => {
    return {
      id: '',
      name: '',
      value: '',
      serviceSlug: '',
      select: distributionCategorySelectId,
      assignable: true,
      position: 0,
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: 'distributionCategoryOption',
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
