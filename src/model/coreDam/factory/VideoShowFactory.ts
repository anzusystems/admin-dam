import type { VideoShow } from '@/types/coreDam/VideoShow'
import type { IntegerIdNullable } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/videoShowApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'

export function useVideoShowFactory() {
  const createDefault = (licenceId: IntegerIdNullable = null): VideoShow => {
    return {
      id: '',
      licence: licenceId,
      texts: {
        title: '',
      },
      attributes: {
        webOrderPosition: 0,
        mobileOrderPosition: 0,
      },
      flags: {
        webPublicExportEnabled: false,
        mobilePublicExportEnabled: false,
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
