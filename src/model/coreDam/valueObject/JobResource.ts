import { type JobBaseResource, useJobBaseResource } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

export const JOB_RESOURCE_PODCAST_SYNCHRONIZER = 'jobPodcastSynchronizer'
export const JOB_AUTHOR_CURRENT_OPTIMIZE = 'jobAuthorCurrentOptimize'
export const JOB_RESOURCE_IMAGE_COPY = 'jobImageCopy'

export type JobResource =
  | typeof JOB_RESOURCE_PODCAST_SYNCHRONIZER
  | typeof JOB_RESOURCE_IMAGE_COPY
  | typeof JOB_AUTHOR_CURRENT_OPTIMIZE
  | JobBaseResource

export function useJobResource() {
  const { t } = useI18n()

  return useJobBaseResource<JobResource>([
    {
      title: t('coreDam.job.jobResource.jobPodcastSynchronizer'),
      value: 'jobPodcastSynchronizer',
    },
    {
      title: t('coreDam.job.jobResource.jobImageCopy'),
      value: 'jobImageCopy',
    },
    {
      title: t('coreDam.job.jobResource.jobAuthorCurrentOptimize'),
      value: 'jobAuthorCurrentOptimize',
    },
  ])
}
