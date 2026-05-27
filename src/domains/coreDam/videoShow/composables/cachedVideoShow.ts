import type { VideoShow, VideoShowMinimal } from '@/domains/coreDam/videoShow/types/VideoShow'
import { fetchVideoShowListByIds } from '@/domains/coreDam/videoShow/api/videoShowApi'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'

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
