import type { Job } from '@/domains/coreDam/job/types/Job'
import { useCommonJobFactory } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export const useJobOneStore = defineStore('damJobOneStore', () => {
  const { createUserDataDelete } = useCommonJobFactory()

  const job = ref<Job>(createUserDataDelete(SYSTEM_CORE_DAM))

  function setJob(newJob: Job) {
    job.value = newJob
  }

  function reset() {
    job.value = createUserDataDelete(SYSTEM_CORE_DAM)
  }

  return {
    job,
    setJob,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useJobOneStore, import.meta.hot))
}
