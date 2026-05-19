import type { AnzuUserAndTimeTrackingAware, DatetimeUTC, DocId, ResourceNameSystemAware } from '@anzusystems/common-admin'

export const RESOURCE_VOICE = 'voice'

export const VoiceDiscriminator = {
  Elevenlabs: 'elevenlabs',
  GoogleTts: 'google_tts',
} as const
export type VoiceDiscriminatorType = (typeof VoiceDiscriminator)[keyof typeof VoiceDiscriminator]

export const GoogleSsmlGender = {
  Male: 'MALE',
  Female: 'FEMALE',
  Neutral: 'NEUTRAL',
} as const
export type GoogleSsmlGenderType = (typeof GoogleSsmlGender)[keyof typeof GoogleSsmlGender]

interface VoiceBase extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  voiceFamily: DocId
  externalVoiceId: string
  main: boolean
  active: boolean
  createdAt: DatetimeUTC
  modifiedAt: DatetimeUTC
  readonly discriminator: VoiceDiscriminatorType
}

export interface ElevenlabsVoice extends VoiceBase {
  discriminator: typeof VoiceDiscriminator.Elevenlabs
  modelId: string
  stability: number
  similarityBoost: number
}

export interface GoogleTtsVoice extends VoiceBase {
  discriminator: typeof VoiceDiscriminator.GoogleTts
  ssmlGender: GoogleSsmlGenderType
  speakingRate: number
  pitch: number
}

export type Voice = ElevenlabsVoice | GoogleTtsVoice

export type VoiceDiscriminatorTypeMap = {
  [VoiceDiscriminator.Elevenlabs]: ElevenlabsVoice
  [VoiceDiscriminator.GoogleTts]: GoogleTtsVoice
}
