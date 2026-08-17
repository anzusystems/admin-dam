import { defineCached } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { useFetchVoiceFamilyListByIds } from '@/domains/coreDam/voiceFamily/api/voiceFamilyApi'
import type { VoiceFamily } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'

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

const {
  cache: voiceFamilyCache,
  fetch: fetchCached,
  add: addCached,
  has: hasCached,
  get: getCached,
  isLoaded: isLoadedCached,
} = defineCached<DocId, VoiceFamily, VoiceFamilyMinimal>(mapFullToMinimal, mapIdToMinimal, (ids: DocId[]) => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const { executeFetch } = useFetchVoiceFamilyListByIds()
  return executeFetch(ids, { urlParams: { extSystemId: currentExtSystemId.value } })
})

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
