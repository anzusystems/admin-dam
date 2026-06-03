import { defineCached } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { fetchVoiceFamilyListByIds } from '@/services/api/coreDam/voiceFamilyApi'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

interface VoiceFamilyMinimal {
  id: DocId
  name: string
}

const mapFullToMinimal = (voiceFamily: VoiceFamily): VoiceFamilyMinimal => ({
  id: voiceFamily.id,
  name: voiceFamily.displayName,
})

const mapIdToMinimal = (id: DocId): VoiceFamilyMinimal => ({
  id: id,
  name: '',
})

const { currentExtSystemId } = useCurrentExtSystem()

const {
  cache: voiceFamilyCache,
  fetch: fetchCached,
  add: addCached,
  has: hasCached,
  get: getCached,
  isLoaded: isLoadedCached,
} = defineCached<DocId, VoiceFamily, VoiceFamilyMinimal>(mapFullToMinimal, mapIdToMinimal, (ids: DocId[]) =>
  fetchVoiceFamilyListByIds(currentExtSystemId.value, ids)
)

export const useCachedVoiceFamiliesById = () => {
  return {
    addToCachedVoiceFamilies: addCached,
    fetchCachedVoiceFamilies: fetchCached,
    cachedVoiceFamiliesById: voiceFamilyCache,
    hasCachedVoiceFamily: hasCached,
    getCachedVoiceFamily: getCached,
    isLoadedCachedVoiceFamily: isLoadedCached,
  }
}
