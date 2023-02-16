import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import type { Job } from '@/types/dam/Job'
import { JobStatus } from '@anzusystems/common-admin'

export function useJobFactory() {
  const createDefault = (): Job => {
    return {
      id: 0,
      status: JobStatus.Default,
      result: '',
      podcastId: '',
      fullSync: false,
      anonymizeUser: false,
      targetUserId: null,
      batchProcessedIterationCount: 0,
      finishedAt: null,
      startedAt: null,
      lastBatchProcessedRecord: '',
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: null,
      modifiedBy: null,
      _resourceName: 'jobUserDataDelete',
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}