import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Job } from '@/types/coreDam/Job'
import { useCommonJobFactory } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ref } from 'vue'

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
