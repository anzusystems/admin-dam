import type { DatetimeUTCNullable, DocId, DocIdNullable, IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'

export const TtsAudioStatus = {
  Active: 'active',
  Superseding: 'superseding',
  Cancelling: 'cancelling',
  Failed: 'failed',
  Unpublished: 'unpublished',
} as const
export type TtsAudioStatus = (typeof TtsAudioStatus)[keyof typeof TtsAudioStatus]

/**
 * Snapshot of the generation moment for a TTS-produced Asset. Mirrors the bundle entity shape
 * after simplify — derivable state lives on Asset / tenant config / PodcastEpisode / request
 * audit, not here.
 */
export interface TtsAsset {
  assetId: DocId
  extResourceName: string | null
  extId: string | null
  voiceFamily: DocId
  discriminator: VoiceDiscriminatorType
  externalVoiceId: string
  sourceTextHash: string
  sourceTextSnapshot: string
  status: TtsAudioStatus
  failureReason: string | null
  staging: boolean
  voiceFamilyKeywordIds: DocId[]
  createdAt: DatetimeUTCNullable
  modifiedAt: DatetimeUTCNullable
}

export const TtsRequestMode = {
  Initial: 'initial',
  Regenerate: 'regenerate',
} as const
export type TtsRequestMode = (typeof TtsRequestMode)[keyof typeof TtsRequestMode]

export const TtsRequestStatus = {
  Waiting: 'waiting',
  Processing: 'processing',
  Done: 'done',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const
export type TtsRequestStatus = (typeof TtsRequestStatus)[keyof typeof TtsRequestStatus]

export const IN_PROGRESS_TTS_REQUEST_STATUSES: readonly TtsRequestStatus[] = [
  TtsRequestStatus.Waiting,
  TtsRequestStatus.Processing,
]

export interface TtsNarrationRequestExtRef {
  extResourceName: string | null
  extId: string | null
  extVersion: string | null
}

export interface TtsNarrationRequestSource {
  text: string | null
}

export interface TtsNarrationRequestMinimal {
  id: DocId
  displayText: string
}

export interface TtsNarrationRequest {
  id: DocId
  status: TtsRequestStatus
  mode: TtsRequestMode
  startedAt: DatetimeUTCNullable
  failureReason: string | null
  openInitialKey: string | null
  stableAssetId: DocIdNullable
  resultAssetId: DocIdNullable
  extSystemId: IntegerId
  assetLicenceId: IntegerIdNullable
  voiceFamilySlug: string | null
  title: string | null
  description: string | null
  keywords: string[]
  authors: string[]
  cancelRequested: boolean
  podcastIds: DocId[]
  createdAt: DatetimeUTCNullable
  modifiedAt: DatetimeUTCNullable
  createdBy: IntegerIdNullable
  modifiedBy: IntegerIdNullable
  extRef: TtsNarrationRequestExtRef
  source: TtsNarrationRequestSource
}

export interface TtsNarrationRequestDetail extends TtsNarrationRequest {
  ttsAsset: TtsAsset | null
}

export interface TtsSynthesizeRequest {
  text: string
  title: string | null
  voiceFamilySlug: string | null
  podcasts: DocId[]
  extSystem: IntegerId
  assetLicence: IntegerId | null
}
