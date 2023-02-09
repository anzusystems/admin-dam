import type { VideoShow } from '@/types/dam/VideoShow'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/videoShowApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { IntegerIdNullable } from '@anzusystems/common-admin'

export function useVideoShowFactory() {
  const createDefault = (licenceId: IntegerIdNullable = null): VideoShow => {
    return {
      id: '',
      licence: licenceId,
      texts: {
        title: '',
      },
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
