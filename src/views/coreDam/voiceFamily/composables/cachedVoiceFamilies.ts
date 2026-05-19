import { ref } from 'vue'
import { usePagination } from '@anzusystems/common-admin'
import { fetchVoiceFamilyList } from '@/services/api/coreDam/voiceFamilyApi'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'

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
