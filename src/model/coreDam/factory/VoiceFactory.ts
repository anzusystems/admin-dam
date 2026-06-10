import type { DocId } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  ELEVENLABS_DEFAULT_MODEL_ID,
  GoogleSsmlGenderDefault,
  RESOURCE_VOICE,
  VoiceDiscriminator,
  type ElevenlabsVoice,
  type GoogleTtsVoice,
  type VoiceDiscriminatorType,
  type VoiceDiscriminatorTypeMap,
} from '@/types/coreDam/Voice'

const createBaseVoice = (voiceFamily: DocId) => ({
  id: '',
  voiceFamily,
  externalVoiceId: '',
  main: false,
  active: true,
  createdAt: dateTimeNow(),
  modifiedAt: dateTimeNow(),
  createdBy: 0,
  modifiedBy: 0,
  _resourceName: RESOURCE_VOICE,
  _system: SYSTEM_CORE_DAM,
})

export function useVoiceKindFactory() {
  const createVoiceKind = <K extends VoiceDiscriminatorType>(
    kind: K,
    voiceFamily: DocId,
  ): VoiceDiscriminatorTypeMap[K] => {
    switch (kind) {
      case VoiceDiscriminator.Elevenlabs: {
        const voice: ElevenlabsVoice = {
          ...createBaseVoice(voiceFamily),
          discriminator: VoiceDiscriminator.Elevenlabs,
          modelId: ELEVENLABS_DEFAULT_MODEL_ID,
          stability: 0.5,
          similarityBoost: 0.75,
        }
        return voice as VoiceDiscriminatorTypeMap[K]
      }
      case VoiceDiscriminator.GoogleTts: {
        const voice: GoogleTtsVoice = {
          ...createBaseVoice(voiceFamily),
          discriminator: VoiceDiscriminator.GoogleTts,
          ssmlGender: GoogleSsmlGenderDefault,
          speakingRate: 1.0,
          pitch: 0.0,
        }
        return voice as VoiceDiscriminatorTypeMap[K]
      }
    }
    throw new Error(`Unknown VoiceDiscriminator: ${kind as string}`)
  }

  return {
    createVoiceKind,
  }
}
