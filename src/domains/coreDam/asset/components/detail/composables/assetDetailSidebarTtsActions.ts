import { ref } from 'vue'
import { type DocId, useAlerts } from '@anzusystems/common-admin'
import { fetchTtsAsset } from '@/domains/coreDam/asset/api/ttsAssetApi'
import type { TtsAssetDetail } from '@/domains/coreDam/asset/types/TtsAsset'
import { useCachedVoiceFamiliesById } from '@/domains/coreDam/voiceFamily/composables/cachedVoiceFamilies'
import { useCachedTtsNarrationRequests } from '@/domains/coreDam/ttsNarrationRequest/composables/cachedTtsNarrationRequests'

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
      if (data.lastRequestId) {
        addToCachedTtsNarrationRequests([data.lastRequestId])
        fetchCachedTtsNarrationRequests()
      }
      if (data.tts?.voiceFamily) {
        addToCachedVoiceFamilies([data.tts.voiceFamily])
        fetchCachedVoiceFamilies()
      }
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
