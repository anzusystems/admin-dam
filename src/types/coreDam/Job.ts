import type {
  DocIdNullable,
  IntegerId,
  IntegerIdNullable,
  JobBase,
  JobUserDataDelete
} from '@anzusystems/common-admin'
import type { JobResource } from '@/model/coreDam/valueObject/JobResource'

export interface JobPodcastSynchronizer extends JobBase<JobResource> {
  podcastId: DocIdNullable
  fullSync: boolean
}

export interface JobImageCopy extends JobBase<JobResource> {
  licence: DocIdNullable
}

export interface JobImageCopyItem {
  id: IntegerId
  sourceAssetId: DocIdNullable
  targetAssetId: DocIdNullable
  status: AssetFileCopyStatus
  job: IntegerIdNullable
}

export enum AssetFileCopyStatus {
  Exists = 'exists',
  Copy = 'copy',
  NotAllowed = 'notAllowed',
  Unassigned = 'unassigned',
}

export interface JobAuthorCurrentOptimize extends JobBase<JobResource> {
  processAll: boolean
  authorId: DocIdNullable
}

export type Job = JobUserDataDelete | JobPodcastSynchronizer | JobImageCopy
