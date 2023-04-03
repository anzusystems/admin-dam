import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Job } from '@/types/coreDam/Job'
import { useCommonJobFactory } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'

interface State {
  job: Job
}

const { createUserDataDelete } = useCommonJobFactory()

export const useJobOneStore = defineStore('damJobOneStore', {
  state: (): State => ({
    job: createUserDataDelete(SYSTEM_CORE_DAM),
  }),
  actions: {
    setJob(job: Job) {
      this.job = job
    },
    reset() {
      this.job = createUserDataDelete(SYSTEM_CORE_DAM)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useJobOneStore, import.meta.hot))
}
