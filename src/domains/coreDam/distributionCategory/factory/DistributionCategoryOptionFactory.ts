import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'

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
