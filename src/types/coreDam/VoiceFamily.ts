import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTC,
  DocId,
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
  keywords: DocId[]
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
  keywords: DocId[]
}

export interface VoiceFamilyUpdate {
  displayName: string
  language: string
  preferredProvider: VoiceDiscriminatorType | null
  active: boolean
  keywords: DocId[]
}
