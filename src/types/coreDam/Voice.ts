import type { AnzuUserAndTimeTrackingAware, DatetimeUTC, DocId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { TtsProvider } from '@/types/coreDam/TtsProvider'

export const RESOURCE_VOICE = 'voice'

export interface Voice extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  voiceFamilyId: DocId
  provider: TtsProvider
  externalVoiceId: string
  metadata: Record<string, unknown>
  primary: boolean
  active: boolean
  createdAt: DatetimeUTC
  modifiedAt: DatetimeUTC
}

export interface VoiceCreate {
  voiceFamilyId: DocId
  provider: TtsProvider
  externalVoiceId: string
  metadata: Record<string, unknown>
  primary: boolean
  active: boolean
}

export interface VoiceUpdate {
  externalVoiceId?: string
  metadata?: Record<string, unknown>
  primary?: boolean
  active?: boolean
}
