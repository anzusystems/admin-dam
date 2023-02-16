import { useJobResource as useBaseJobResource, type JobResource as BaseJobResource } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

export type JobResource = 'jobPodcastSynchronizer' | BaseJobResource

export function useJobResource() {
  const { t } = useI18n({ useScope: 'global' })

  return useBaseJobResource<JobResource>([
    {
      title: t('coreDam.job.jobResource.jobPodcastSynchronizer'),
      value: 'jobPodcastSynchronizer',
    },
  ])
}
