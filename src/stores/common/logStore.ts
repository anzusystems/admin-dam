import { useLogFactory } from '@/model/common/factory/LogFactory'
import type { Log } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'

interface State {
  log: Log
}

const { createDefault } = useLogFactory()

export const useLogOneStore = defineStore('commonLogOneStore', {
  state: (): State => ({
    log: createDefault(),
  }),
  actions: {
    setLog(log: Log) {
      this.log = log
    },
    reset() {
      this.log = createDefault()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLogOneStore, import.meta.hot))
}
