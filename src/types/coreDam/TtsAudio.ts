import type { IntegerId, JobBase } from '@anzusystems/common-admin'
import type { JobResource } from '@/model/coreDam/valueObject/JobResource'

export const TtsJobMode = {
  Initial: 'initial',
  Regenerate: 'regenerate',
} as const
export type TtsJobMode = (typeof TtsJobMode)[keyof typeof TtsJobMode]

export interface JobAudioNarration extends JobBase<JobResource> {
  voiceFamilySlug: string | null
  title: string | null
  mode: TtsJobMode
  cancelRequested: boolean
  failureReason: string | null
}

export const TtsSynthesizeStatus = {
  Pending: 'pending',
  AlreadyExists: 'already_exists',
  AlreadyPending: 'already_pending',
} as const
export type TtsSynthesizeStatus = (typeof TtsSynthesizeStatus)[keyof typeof TtsSynthesizeStatus]

export const TtsCancelJobStatus = {
  Cancelled: 'cancelled',
  SwapCompleted: 'swap_completed',
  AlreadyFailed: 'already_failed',
} as const
export type TtsCancelJobStatus = (typeof TtsCancelJobStatus)[keyof typeof TtsCancelJobStatus]

export interface TtsSynthesizeRequest {
  text: string
  voiceFamilySlug: string | null
  includeInRecommendedPodcast: boolean
  assetLicence: IntegerId
}

export interface TtsSynthesizeResponse {
  jobId: IntegerId
  status: TtsSynthesizeStatus
}

export interface TtsCancelJobRequest {
  reason: string | null
}

export interface TtsCancelJobResponse {
  status: TtsCancelJobStatus
  tooLate: boolean
}
