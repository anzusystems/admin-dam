import type { DocId } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  RESOURCE_VOICE,
  VoiceDiscriminator,
  type ElevenlabsVoice,
  type GoogleTtsVoice,
  type VoiceDiscriminatorType,
  type VoiceDiscriminatorTypeMap,
} from '@/types/coreDam/Voice'

const createBaseVoice = (voiceFamily: DocId) => ({
  id: '' as DocId,
  voiceFamily,
  externalVoiceId: '',
  main: false,
  active: true,
  createdAt: dateTimeNow(),
  modifiedAt: dateTimeNow(),
  createdBy: 1,
  modifiedBy: 1,
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
          modelId: 'eleven_multilingual_v2',
          stability: 0.5,
          similarityBoost: 0.75,
        }
        return voice as VoiceDiscriminatorTypeMap[K]
      }
      case VoiceDiscriminator.GoogleTts: {
        const voice: GoogleTtsVoice = {
          ...createBaseVoice(voiceFamily),
          discriminator: VoiceDiscriminator.GoogleTts,
          ssmlGender: 'NEUTRAL',
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
