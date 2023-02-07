import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { useExtSystemFactory } from '@/model/dam/factory/ExtSystemFactory'

const { createDefault } = useExtSystemFactory()

interface State {
  extSystem: ExtSystem
}

export const useExtSystemOneStore = defineStore('extSystemOneStore', {
  state: (): State => ({
    extSystem: createDefault(),
  }),
  actions: {
    setExtSystem(extSystem: ExtSystem) {
      this.extSystem = extSystem
    },
    reset() {
      this.extSystem = createDefault()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExtSystemOneStore, import.meta.hot))
}
