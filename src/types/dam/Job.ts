import type { Job as BaseJob } from '@anzusystems/common-admin'
import type { JobResource } from '@/model/dam/valueObject/JobResource'

export interface Job extends BaseJob<JobResource> {
  podcastId: string
  fullSync: boolean
}
