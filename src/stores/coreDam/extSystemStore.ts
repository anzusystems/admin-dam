import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DamExtSystem } from '@anzusystems/common-admin'
import { useExtSystemFactory } from '@/model/coreDam/factory/ExtSystemFactory'
import { ref } from 'vue'

export const useExtSystemOneStore = defineStore('extSystemOneStore', () => {
  const { createDefault } = useExtSystemFactory()

  const extSystem = ref<DamExtSystem>(createDefault())

  function setExtSystem(newExtSystem: DamExtSystem) {
    extSystem.value = newExtSystem
  }

  function reset() {
    extSystem.value = createDefault()
  }

  return {
    extSystem,
    setExtSystem,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExtSystemOneStore, import.meta.hot))
}
