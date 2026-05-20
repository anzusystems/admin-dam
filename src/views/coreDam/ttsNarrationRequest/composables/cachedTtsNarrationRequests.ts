import type { TtsNarrationRequest, TtsNarrationRequestMinimal } from '@/types/coreDam/TtsNarrationRequest'
import { fetchTtsNarrationRequestListByIds } from '@/services/api/coreDam/ttsNarrationRequestApi'
import type { DocId } from '@anzusystems/common-admin'
import { defineCached } from '@anzusystems/common-admin'

const mapFullToMinimal = (request: TtsNarrationRequest): TtsNarrationRequestMinimal => ({
  id: request.id,
  displayText: request.title && request.title.length > 0 ? request.title : `#${request.id.slice(0, 8)}`,
})

const mapIdToMinimal = (id: DocId): TtsNarrationRequestMinimal => ({
  id,
  displayText: `#${id.slice(0, 8)}`,
})

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  DocId,
  TtsNarrationRequest,
  TtsNarrationRequestMinimal
>(mapFullToMinimal, mapIdToMinimal, (ids) => fetchTtsNarrationRequestListByIds(ids))

export const useCachedTtsNarrationRequests = () => {
  return {
    addManualToCachedTtsNarrationRequests: addManual,
    addToCachedTtsNarrationRequests: add,
    fetchCachedTtsNarrationRequests: fetch,
    cachedTtsNarrationRequests: cache,
    hasCachedTtsNarrationRequest: has,
    getCachedTtsNarrationRequest: get,
    isLoadedCachedTtsNarrationRequest: isLoaded,
  }
}
