import type { DocIdNullable, JobBase, JobUserDataDelete } from '@anzusystems/common-admin'
import type { JobResource } from '@/model/coreDam/valueObject/JobResource'

export interface JobPodcastSynchronizer extends JobBase<JobResource> {
  podcastId: DocIdNullable
  fullSync: boolean
}

export type Job = JobUserDataDelete | JobPodcastSynchronizer
