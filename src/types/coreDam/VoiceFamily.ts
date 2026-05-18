import type { AnzuUserAndTimeTrackingAware, DatetimeUTC, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { TtsProvider } from '@/types/coreDam/TtsProvider'

export const RESOURCE_VOICE_FAMILY = 'voiceFamily'

export interface VoiceFamily extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  extSystemId: IntegerId
  slug: string
  displayName: string
  language: string
  preferredProvider: TtsProvider | null
  active: boolean
  createdAt: DatetimeUTC
  modifiedAt: DatetimeUTC
}

export interface VoiceFamilyCreate {
  extSystemId: IntegerId
  slug: string
  displayName: string
  language: string
  preferredProvider: TtsProvider | null
  active: boolean
}

export interface VoiceFamilyUpdate {
  displayName: string
  language: string
  preferredProvider: TtsProvider | null
  active: boolean
}
