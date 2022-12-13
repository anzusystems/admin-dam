import { readonly, ref, watch } from 'vue'
import { damConfig, damConfigInitialized } from '@/services/DamConfigService'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { fetchExtSystem } from '@/services/api/dam/extSystemApi'

const currentExtSystemId = ref(0)
const currentExtSystem = ref<ExtSystem>()

export const initCurrentExtSystem = () => {
  watch(currentExtSystemId, async () => {
    if (currentExtSystemId.value) {
      currentExtSystem.value = await fetchExtSystem(currentExtSystemId.value)
    }
  })

  return new Promise((resolve, reject) => {
    if (!damConfigInitialized.value) {
      console.error('Config must be loaded first.')
      reject(false)
    }
    if (damConfig.settings.allowSelectExtSystem) {
      console.error('Not yet implemented.')
      reject(false)
    }
    currentExtSystemId.value = damConfig.settings.defaultExtSystemId
    resolve(true)
  })
}

export function useCurrentExtSystem() {
  return {
    currentExtSystemId: readonly(currentExtSystemId),
    currentExtSystem: readonly(currentExtSystem),
  }
}
