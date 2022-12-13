import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { useExtSystemFactory } from '@/model/dam/factory/ExtSystemFactory'

const { createDefault } = useExtSystemFactory()

interface State {
  extSystem: ExtSystem
  loaded: boolean
}

export const useExtSystemOneStore = defineStore('extSystemOneStore', {
  state: (): State => ({
    extSystem: createDefault(),
    loaded: false,
  }),
  actions: {
    setExtSystem(extSystem: ExtSystem) {
      this.extSystem = extSystem
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.extSystem = createDefault()
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExtSystemOneStore, import.meta.hot))
}
