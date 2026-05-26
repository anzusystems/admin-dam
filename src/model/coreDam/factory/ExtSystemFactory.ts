import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/extSystemApi'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'
import { TtsActiveProviderMode } from '@/types/coreDam/TtsActiveProviderMode'

export function useExtSystemFactory() {
  const createDefault = (): ExtSystem => {
    return {
      id: 0,
      name: '',
      slug: '',
      adminUsers: [],
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
      ttsSettings: {
        activeProviderMode: TtsActiveProviderMode.Auto,
        defaultVoiceFamilyId: null,
      },
      ttsDefaultAssetLicence: null,
    }
  }

  return {
    createDefault,
  }
}
