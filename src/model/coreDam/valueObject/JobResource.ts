import { type JobBaseResource, useJobBaseResource } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

export const JOB_RESOURCE_PODCAST_SYNCHRONIZER = 'jobPodcastSynchronizer'

export type JobResource = typeof JOB_RESOURCE_PODCAST_SYNCHRONIZER | JobBaseResource

export function useJobResource() {
  const { t } = useI18n()

  return useJobBaseResource<JobResource>([
    {
      title: t('coreDam.job.jobResource.jobPodcastSynchronizer'),
      value: 'jobPodcastSynchronizer',
    },
  ])
}
