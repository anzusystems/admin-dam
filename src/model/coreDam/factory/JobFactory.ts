import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useCommonJobFactory } from '@anzusystems/common-admin'
import type { JobPodcastSynchronizer } from '@/types/coreDam/Job'
import { JOB_RESOURCE_PODCAST_SYNCHRONIZER } from '@/model/coreDam/valueObject/JobResource'

export function useJobFactory() {
  const { createBase } = useCommonJobFactory()
  const createPodcastSynchronizer = (): JobPodcastSynchronizer => {
    return {
      ...createBase(JOB_RESOURCE_PODCAST_SYNCHRONIZER, SYSTEM_CORE_DAM),
      ...{
        podcastId: null,
        fullSync: false,
      },
    }
  }

  return {
    createPodcastSynchronizer,
  }
}
