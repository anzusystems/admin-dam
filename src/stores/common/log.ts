import { useLogFactory } from '@/model/common/factory/LogFactory'
import type { Log } from '@/types/common/Log'
import { defineStore, acceptHMRUpdate } from 'pinia'

interface State {
  log: Log
  loaded: boolean
}

const { createDefault } = useLogFactory()

export const useLogOneStore = defineStore('commonLogOneStore', {
  state: (): State => ({
    log: createDefault(),
    loaded: false,
  }),
  actions: {
    setLog(log: Log) {
      this.log = log
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.log = createDefault()
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLogOneStore, import.meta.hot))
}
