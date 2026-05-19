import { ref } from 'vue'
import { defineCached, usePagination } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { fetchVoiceFamilyList, fetchVoiceFamilyListByIds } from '@/services/api/coreDam/voiceFamilyApi'
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

const {
  cache: voiceFamilyCache,
  fetch: fetchCached,
  add: addCached,
  has: hasCached,
  get: getCached,
  isLoaded: isLoadedCached,
} = defineCached<DocId, VoiceFamily, VoiceFamilyMinimal>(mapFullToMinimal, mapIdToMinimal, (ids: DocId[]) => {
  const { currentExtSystemId } = useCurrentExtSystem()
  return fetchVoiceFamilyListByIds(currentExtSystemId.value, ids)
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

const voiceFamilies = ref<VoiceFamily[]>([])
const loading = ref(false)
let fetchPromise: Promise<VoiceFamily[]> | null = null

const fetchAll = async (): Promise<VoiceFamily[]> => {
  const pagination = usePagination('slug')
  pagination.rowsPerPage = 200
  return await fetchVoiceFamilyList(pagination, {})
}

const loadVoiceFamilies = async (): Promise<VoiceFamily[]> => {
  if (voiceFamilies.value.length > 0) return voiceFamilies.value
  if (fetchPromise) return fetchPromise
  loading.value = true
  fetchPromise = fetchAll()
    .then((res) => {
      voiceFamilies.value = res
      return res
    })
    .catch((err) => {
      fetchPromise = null
      throw err
    })
    .finally(() => {
      loading.value = false
    })
  return fetchPromise
}

export const useCachedVoiceFamilies = () => {
  return {
    voiceFamilies,
    loading,
    loadVoiceFamilies,
  }
}
