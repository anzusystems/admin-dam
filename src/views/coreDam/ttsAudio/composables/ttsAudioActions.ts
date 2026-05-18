import { ref } from 'vue'
import { type FilterBag, type IntegerId, JobStatus, type Pagination, useAlerts } from '@anzusystems/common-admin'
import type {
  JobAudioNarration,
  TtsCancelJobRequest,
  TtsCancelJobResponse,
  TtsSynthesizeRequest,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsAudio'
import { TtsCancelJobStatus, TtsSynthesizeStatus } from '@/types/coreDam/TtsAudio'
import {
  cancelTtsAudioJob,
  fetchTtsAudioJobList,
  synthesizeTtsAudio,
} from '@/services/api/coreDam/ttsAudioApi'

const { showRecordWas, showErrorsDefault, showWarning } = useAlerts()

const CANCELLABLE_STATUSES: ReadonlyArray<string> = [
  JobStatus.Waiting,
  JobStatus.Processing,
  JobStatus.AwaitingBatchProcess,
]

export const isCancellableJob = (job: JobAudioNarration): boolean =>
  !job.cancelRequested && CANCELLABLE_STATUSES.includes(job.status)

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const synthesizeButtonLoading = ref(false)
const cancelJobButtonLoading = ref(false)

export const useTtsAudioListActions = () => {
  const listItems = ref<Array<JobAudioNarration>>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchTtsAudioJobList(pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const useTtsAudioSynthesizeActions = () => {
  const synthesize = async (payload: TtsSynthesizeRequest): Promise<TtsSynthesizeResponse | null> => {
    synthesizeButtonLoading.value = true
    try {
      const res = await synthesizeTtsAudio(payload)
      if (res.status === TtsSynthesizeStatus.Pending) {
        showRecordWas('created')
      } else if (res.status === TtsSynthesizeStatus.AlreadyPending) {
        showWarning('coreDam.ttsAudio.synthesize.alreadyPending')
      } else if (res.status === TtsSynthesizeStatus.AlreadyExists) {
        showWarning('coreDam.ttsAudio.synthesize.alreadyExists')
      }
      return res
    } catch (error) {
      showErrorsDefault(error)
      return null
    } finally {
      synthesizeButtonLoading.value = false
    }
  }

  return {
    synthesizeButtonLoading,
    synthesize,
  }
}

export const useTtsAudioCancelJobActions = () => {
  const cancelJob = async (jobId: IntegerId, payload: TtsCancelJobRequest): Promise<TtsCancelJobResponse | null> => {
    cancelJobButtonLoading.value = true
    try {
      const res = await cancelTtsAudioJob(jobId, payload)
      if (res.status === TtsCancelJobStatus.Cancelled) {
        showRecordWas('updated')
      } else if (res.status === TtsCancelJobStatus.SwapCompleted) {
        showWarning('coreDam.ttsAudio.cancelJob.swapCompleted')
      } else if (res.status === TtsCancelJobStatus.AlreadyFailed) {
        showWarning('coreDam.ttsAudio.cancelJob.alreadyFailed')
      }
      return res
    } catch (error) {
      showErrorsDefault(error)
      return null
    } finally {
      cancelJobButtonLoading.value = false
    }
  }

  return {
    cancelJobButtonLoading,
    cancelJob,
  }
}
