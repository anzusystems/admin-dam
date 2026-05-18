import type { Voice } from '@/types/coreDam/Voice'
import { RESOURCE_VOICE } from '@/types/coreDam/Voice'
import { TtsProvider } from '@/types/coreDam/TtsProvider'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'

export function useVoiceFactory() {
  const createDefault = (voiceFamilyId: DocId = ''): Voice => {
    return {
      id: '',
      voiceFamilyId,
      provider: TtsProvider.Elevenlabs,
      externalVoiceId: '',
      metadata: {},
      primary: false,
      active: true,
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      _resourceName: RESOURCE_VOICE,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
