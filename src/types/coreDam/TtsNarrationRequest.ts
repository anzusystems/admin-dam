import type { DatetimeUTCNullable, DocId, DocIdNullable, IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'

export const TtsAudioStatus = {
  Active: 'active',
  Superseding: 'superseding',
  Cancelling: 'cancelling',
  Failed: 'failed',
  Unpublished: 'unpublished',
} as const
export type TtsAudioStatusType = (typeof TtsAudioStatus)[keyof typeof TtsAudioStatus]

/**
 * Snapshot of the generation moment for a TTS-produced Asset. Mirrors the bundle entity shape
 * after simplify — derivable state lives on Asset / tenant config / PodcastEpisode / request
 * audit, not here.
 */
export interface TtsAsset {
  assetId: DocId
  voiceFamily: DocId
  provider: VoiceDiscriminatorType
  externalVoiceId: string
  sourceTextHash: string
  sourceTextSnapshot: string
  status: TtsAudioStatusType
  failureReason: string | null
  createdAt: DatetimeUTCNullable
  modifiedAt: DatetimeUTCNullable
}

export const TtsRequestMode = {
  Initial: 'initial',
  Regenerate: 'regenerate',
} as const
export type TtsRequestModeType = (typeof TtsRequestMode)[keyof typeof TtsRequestMode]

export const TtsRequestStatus = {
  Waiting: 'waiting',
  Processing: 'processing',
  Done: 'done',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const
export type TtsRequestStatusType = (typeof TtsRequestStatus)[keyof typeof TtsRequestStatus]

export interface TtsNarrationRequestMinimal {
  id: DocId
  displayText: string
}

export interface TtsNarrationRequest {
  id: DocId
  status: TtsRequestStatusType
  mode: TtsRequestModeType
  startedAt: DatetimeUTCNullable
  failureReason: string | null
  assetId: DocIdNullable
  extSystemId: IntegerId
  assetLicence: IntegerId
  voiceFamilySlug: string | null
  title: string | null
  cancelRequested: boolean
  createdAt: DatetimeUTCNullable
  modifiedAt: DatetimeUTCNullable
  createdBy: IntegerIdNullable
  modifiedBy: IntegerIdNullable
}

export interface TtsNarrationRequestDetail extends TtsNarrationRequest {
  ttsAsset: TtsAsset | null
}

// Mirrors the BE TtsSynthesizeRequestDto. `assetLicence` is nullable for the form (the user picks
// it); validation enforces it before send. extSystem is derived from the licence on the BE, so it
// is not part of the payload — the dialog keeps it as a separate UI-only ref to scope the pickers.
export interface TtsSynthesizeRequestDto {
  text: string
  title: string | null
  voiceFamilySlug: string | null
  podcasts: DocId[]
  assetLicence: IntegerIdNullable
}

// /synthesize outcome: pending | duplicate (existingAssetId) | alreadyPending.
export interface TtsSynthesizeResponse {
  status: string
  assetId: DocIdNullable
  existingAssetId: DocIdNullable
}
