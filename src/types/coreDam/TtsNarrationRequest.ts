import type { DatetimeUTCNullable, DocId, DocIdNullable, IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'

export const TtsAudioStatus = {
  Active: 'active',
  Superseding: 'superseding',
  Cancelling: 'cancelling',
  Failed: 'failed',
  Unpublished: 'unpublished',
} as const
export type TtsAudioStatus = (typeof TtsAudioStatus)[keyof typeof TtsAudioStatus]

export interface TtsAsset {
  assetId: DocId
  extResourceName: string | null
  extId: string | null
  extVersion: string | null
  assetLicenceId: IntegerId
  voiceFamilySlug: string
  voiceFamilyId: DocId
  discriminator: string
  externalVoiceId: string
  sourceTextHash: string
  sourceTextSnapshot: string
  generatedAt: DatetimeUTCNullable
  lastRegeneratedAt: DatetimeUTCNullable
  status: TtsAudioStatus
  failureReason: string | null
  isStaging: boolean
  includeInRecommendedPodcast: boolean
  autoPodcastId: DocIdNullable
  recommendedPodcastId: DocIdNullable
  voiceFamilyKeywordId: DocIdNullable
  createdAt: DatetimeUTCNullable
  modifiedAt: DatetimeUTCNullable
}

export interface TtsNarrationRequestDetail {
  request: TtsNarrationRequest
  ttsAsset: TtsAsset | null
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

export interface TtsNarrationRequestExtRef {
  extResourceName: string | null
  extId: string | null
  extVersion: string | null
}

export interface TtsNarrationRequestSource {
  text: string | null
  hash: string | null
}

export interface TtsNarrationRequestPodcastOptions {
  autoPodcastId: DocIdNullable
  recommendedPodcastId: DocIdNullable
  includeInRecommended: boolean
}

export interface TtsNarrationRequest {
  id: DocId
  status: TtsRequestStatus
  mode: TtsRequestMode
  startedAt: DatetimeUTCNullable
  finishedAt: DatetimeUTCNullable
  failureReason: string | null
  openInitialKey: string | null
  stableAssetId: DocIdNullable
  resultAssetId: DocIdNullable
  assetLicenceId: IntegerIdNullable
  voiceFamilySlug: string | null
  title: string | null
  cancelRequested: boolean
  createdAt: DatetimeUTCNullable
  modifiedAt: DatetimeUTCNullable
  createdBy: IntegerIdNullable
  modifiedBy: IntegerIdNullable
  extRef: TtsNarrationRequestExtRef
  source: TtsNarrationRequestSource
  podcastOptions: TtsNarrationRequestPodcastOptions
}

export const TtsSynthesizeStatus = {
  Pending: 'pending',
  AlreadyExists: 'already_exists',
  AlreadyPending: 'already_pending',
} as const
export type TtsSynthesizeStatus = (typeof TtsSynthesizeStatus)[keyof typeof TtsSynthesizeStatus]

export const TtsCancelRequestStatus = {
  Cancelled: 'cancelled',
  SwapCompleted: 'swap_completed',
  AlreadyFailed: 'already_failed',
} as const
export type TtsCancelRequestStatus = (typeof TtsCancelRequestStatus)[keyof typeof TtsCancelRequestStatus]

export interface TtsSynthesizeRequest {
  text: string
  voiceFamilySlug: string | null
  includeInRecommendedPodcast: boolean
  assetLicence: IntegerId
}

export interface TtsSynthesizeResponse {
  requestId: DocId
  status: TtsSynthesizeStatus
}

export interface TtsCancelRequestPayload {
  reason: string | null
}

export interface TtsCancelRequestResponse {
  status: TtsCancelRequestStatus
  tooLate: boolean
}
