import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Job } from '@/types/dam/Job'
import { useJobFactory } from '@/model/dam/factory/JobFactory'

interface State {
  job: Job
}

const { createDefault } = useJobFactory()

export const useJobOneStore = defineStore('damJobOneStore', {
  state: (): State => ({
    job: createDefault(),
  }),
  actions: {
    setJob(job: Job) {
      this.job = job
    },
    reset() {
      this.job = createDefault()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useJobOneStore, import.meta.hot))
}