import { ref } from 'vue'

const activeExternalProvider = ref<string | null>(null)

export const useExternalProviders = () => {
  return {
    activeExternalProvider,
  }
}
