import type { VideoShow, VideoShowMinimal } from '@/types/coreDam/VideoShow'
import { fetchVideoShowListByIds } from '@/services/api/coreDam/videoShowApi'
import type { DocId } from '@anzusystems/common-admin'
import { defineCached } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const mapFullToMinimal = (videoShow: VideoShow): VideoShowMinimal => ({
  id: videoShow.id,
  title: videoShow.texts.title,
})

const mapIdToMinimal = (id: DocId): VideoShowMinimal => {
  return { id: id, title: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<DocId, VideoShow, VideoShowMinimal>(
  mapFullToMinimal,
  mapIdToMinimal,
  (ids) => {
    const { currentExtSystemId } = useCurrentExtSystem()
    return fetchVideoShowListByIds(currentExtSystemId.value, ids)
  }
)

export const useCachedVideoShows = () => {
  return {
    addManualToCachedVideoShows: addManual,
    addToCachedVideoShows: add,
    fetchCachedVideoShows: fetch,
    cachedVideoShows: cache,
    hasCachedVideoShow: has,
    getCachedVideoShow: get,
    isLoadedCachedVideoShow: isLoaded,
  }
}
