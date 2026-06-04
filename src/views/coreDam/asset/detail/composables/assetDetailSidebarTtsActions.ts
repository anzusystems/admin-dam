import { ref } from 'vue'
import { type DocId, useAlerts } from '@anzusystems/common-admin'
import { fetchTtsAsset } from '@/services/api/coreDam/ttsAssetApi'
import type { TtsAssetDetail } from '@/types/coreDam/TtsAsset'
import { useCachedVoiceFamiliesById } from '@/views/coreDam/voiceFamily/composables/cachedVoiceFamilies'
import { useCachedTtsNarrationRequests } from '@/views/coreDam/ttsNarrationRequest/composables/cachedTtsNarrationRequests'

export function useAssetDetailSidebarTtsActions() {
  const { showErrorsDefault } = useAlerts()
  const { addToCachedVoiceFamilies, fetchCachedVoiceFamilies } = useCachedVoiceFamiliesById()
  const { addToCachedTtsNarrationRequests, fetchCachedTtsNarrationRequests } = useCachedTtsNarrationRequests()

  const loading = ref(false)
  const detail = ref<TtsAssetDetail | null>(null)

  const fetchData = async (assetId: DocId) => {
    loading.value = true
    try {
      const data = await fetchTtsAsset(assetId)
      detail.value = data
      if (!data) return
      if (data.lastRequestId) addToCachedTtsNarrationRequests([data.lastRequestId])
      if (data.tts?.voiceFamily) addToCachedVoiceFamilies([data.tts.voiceFamily])
      await Promise.all([fetchCachedVoiceFamilies(), fetchCachedTtsNarrationRequests()])
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    detail,
    fetchData,
  }
}
