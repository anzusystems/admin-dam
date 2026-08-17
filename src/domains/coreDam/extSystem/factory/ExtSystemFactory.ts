import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'
import type { ExtSystem } from '@/domains/coreDam/extSystem/types/ExtSystem'
import { TtsActiveProviderModeDefault } from '@/domains/coreDam/ttsNarrationRequest/types/TtsActiveProviderMode'

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
        activeProviderMode: TtsActiveProviderModeDefault,
        defaultVoiceFamilyId: null,
        autoKeywordId: null,
      },
      ttsFreeAudioEpilogAsset: null,
    }
  }

  return {
    createDefault,
  }
}
