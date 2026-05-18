import { acceptHMRUpdate, defineStore } from 'pinia'
import { useVoiceFamilyFactory } from '@/model/coreDam/factory/VoiceFamilyFactory'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'
import { ref } from 'vue'

export const useVoiceFamilyOneStore = defineStore('voiceFamilyOneStore', () => {
  const { createDefault } = useVoiceFamilyFactory()

  const voiceFamily = ref<VoiceFamily>(createDefault())

  function reset() {
    voiceFamily.value = createDefault()
  }

  return {
    voiceFamily,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVoiceFamilyOneStore, import.meta.hot))
}
