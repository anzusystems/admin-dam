import { dateTimeNow, nextListEditorTempId } from '@anzusystems/common-admin'

import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useDistributionCategoryOptionFactory() {
  const createDefault = (distributionCategorySelectId: string): DistributionCategoryOption => {
    return {
      // Negative temp id gives new (unsaved) rows a unique list-editor key; stripped back to '' on save.
      id: String(nextListEditorTempId()),
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
