import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useCommonJobFactory } from '@anzusystems/common-admin'
import type {
  JobAssetFileReprocessInternalFlag,
  JobAuthorCurrentOptimize,
  JobPodcastSynchronizer,
  JobSynchronizeImageChanged,
} from '@/types/coreDam/Job'
import {
  JOB_AUTHOR_CURRENT_OPTIMIZE,
  JOB_RESOURCE_ASSET_FILE_REPROCESS_INTERNAL_FLAG,
  JOB_RESOURCE_PODCAST_SYNCHRONIZER,
  JOB_RESOURCE_SYNCHRONIZE_IMAGE_CHANGED,
} from '@/model/coreDam/valueObject/JobResource'

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

  const createAssetFileReprocessInternalFlag = (): JobAssetFileReprocessInternalFlag => {
    return {
      ...createBase(JOB_RESOURCE_ASSET_FILE_REPROCESS_INTERNAL_FLAG, SYSTEM_CORE_DAM),
      ...{ targetLicenceId: 0, processFrom: null, processUntil: null, bulkSize: 500 },
    }
  }

  const createSynchronizeImageChanged = (): JobSynchronizeImageChanged => {
    return {
      ...createBase(JOB_RESOURCE_SYNCHRONIZE_IMAGE_CHANGED, SYSTEM_CORE_DAM),
      ...{ targetLicenceId: 0, processFrom: null, processUntil: null, bulkSize: 500 },
    }
  }

  return {
    createPodcastSynchronizer,
    createAuthorCurrentOptimize,
    createAssetFileReprocessInternalFlag,
    createSynchronizeImageChanged,
  }
}
