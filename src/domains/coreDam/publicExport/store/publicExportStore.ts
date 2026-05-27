import { usePublicExportFactory } from '@/domains/coreDam/publicExport/factory/PublicExportFactory'
import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'

export const usePublicExportOneStore = defineStore('damPublicExportStore', () => {
  const { createDefault } = usePublicExportFactory()

  const publicExport = ref<PublicExport>(createDefault())

  function reset() {
    publicExport.value = createDefault()
  }

  return {
    publicExport,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePublicExportOneStore, import.meta.hot))
}
