import type { TtsNarrationRequest, TtsNarrationRequestMinimal } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { useFetchTtsNarrationRequest } from '@/domains/coreDam/ttsNarrationRequest/api/ttsNarrationRequestApi'
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

// The BE exposes no batch endpoint for narration requests (only get-one), so resolve each id
// individually. In practice the cache only ever holds a single referenced request (e.g. an asset's
// lastRequestId), so the fan-out stays tiny.
const { executeRequest: fetchTtsNarrationRequest } = useFetchTtsNarrationRequest()

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  DocId,
  TtsNarrationRequest,
  TtsNarrationRequestMinimal
>(mapFullToMinimal, mapIdToMinimal, (ids) =>
  Promise.all(ids.map((id) => fetchTtsNarrationRequest({ urlParams: { id } })))
)

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
