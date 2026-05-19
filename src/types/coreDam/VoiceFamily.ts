import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTC,
  DocId,
  DocIdNullable,
  IntegerId,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'

export const RESOURCE_VOICE_FAMILY = 'voiceFamily'

export interface VoiceFamily extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  extSystemId: IntegerId
  slug: string
  displayName: string
  language: string
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keyword: DocIdNullable
  createdAt: DatetimeUTC
  modifiedAt: DatetimeUTC
}

export interface VoiceFamilyCreate {
  extSystemId: IntegerId
  slug: string
  displayName: string
  language: string
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keyword: DocIdNullable
}

export interface VoiceFamilyUpdate {
  displayName: string
  language: string
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keyword: DocIdNullable
}
