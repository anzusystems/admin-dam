import { type JobResource as BaseJobResource, useJobResource as useBaseJobResource } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

export type JobResource = 'jobPodcastSynchronizer' | BaseJobResource

export function useJobResource() {
  const { t } = useI18n()

  return useBaseJobResource<JobResource>([
    {
      title: t('coreDam.job.jobResource.jobPodcastSynchronizer'),
      value: 'jobPodcastSynchronizer',
    },
  ])
}
