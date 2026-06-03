import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'

export const RESOURCE_VOICE_FAMILY = 'voiceFamily'

export const Language = {
  Slovak: 'sk',
  English: 'en',
} as const
export type LanguageType = (typeof Language)[keyof typeof Language]

export interface VoiceFamily extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  extSystem: IntegerId
  slug: string
  displayName: string
  language: LanguageType
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keywords: DocId[]
}

export interface VoiceFamilyCreate {
  extSystem: IntegerId
  slug: string
  displayName: string
  language: LanguageType
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keywords: DocId[]
}

export interface VoiceFamilyUpdate {
  // slug is sent but immutable — the BE manager must not apply it on update
  slug: string
  displayName: string
  language: LanguageType
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keywords: DocId[]
}
