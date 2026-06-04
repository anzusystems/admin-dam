import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'
import { LanguageDefault, RESOURCE_VOICE_FAMILY } from '@/types/coreDam/VoiceFamily'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'

export function useVoiceFamilyFactory() {
  const createDefault = (extSystem = 0): VoiceFamily => {
    return {
      id: '',
      extSystem,
      slug: '',
      displayName: '',
      language: LanguageDefault,
      preferredProvider: null,
      active: true,
      keywords: [],
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: RESOURCE_VOICE_FAMILY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
