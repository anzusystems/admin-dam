import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useCommonJobFactory } from '@anzusystems/common-admin'
import type { JobAuthorCurrentOptimize, JobPodcastSynchronizer } from '@/domains/coreDam/job/types/Job'
import {
  JOB_AUTHOR_CURRENT_OPTIMIZE,
  JOB_RESOURCE_PODCAST_SYNCHRONIZER,
} from '@/domains/coreDam/job/valueObject/JobResource'

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

  const createAuthorCurrentOptimize = (): JobAuthorCurrentOptimize => {
    return {
      ...createBase(JOB_AUTHOR_CURRENT_OPTIMIZE, SYSTEM_CORE_DAM),
      ...{
        processAll: false,
        authorId: null,
      },
    }
  }

  return {
    createPodcastSynchronizer,
    createAuthorCurrentOptimize,
  }
}
