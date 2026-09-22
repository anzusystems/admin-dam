import type { ExtSystem } from '@/domains/coreDam/extSystem/types/ExtSystem'
import { useExtSystemFactory } from '@/domains/coreDam/extSystem/factory/ExtSystemFactory'

export const useExtSystemOneStore = defineStore('extSystemOneStore', () => {
  const { createDefault } = useExtSystemFactory()

  const extSystem = ref<ExtSystem>(createDefault())

  function reset() {
    extSystem.value = createDefault()
  }

  return {
    extSystem,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExtSystemOneStore, import.meta.hot))
}
