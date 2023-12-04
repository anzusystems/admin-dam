import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DamExtSystem } from '@/types/coreDam/DamExtSystem'
import { useExtSystemFactory } from '@/model/coreDam/factory/ExtSystemFactory'

const { createDefault } = useExtSystemFactory()

interface State {
  extSystem: DamExtSystem
}

export const useExtSystemOneStore = defineStore('extSystemOneStore', {
  state: (): State => ({
    extSystem: createDefault(),
  }),
  actions: {
    setExtSystem(extSystem: DamExtSystem) {
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
