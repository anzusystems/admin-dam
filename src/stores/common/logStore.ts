import { useLogFactory } from '@/model/common/factory/LogFactory'
import type { Log } from '@anzusystems/common-admin'

export const useLogOneStore = defineStore('commonLogOneStore', () => {
  const { createDefault } = useLogFactory()

  const log = ref<Log>(createDefault())

  function setLog(newLog: Log) {
    log.value = newLog
  }

  function reset() {
    log.value = createDefault()
  }

  return {
    log,
    setLog,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLogOneStore, import.meta.hot))
}
