import type { Podcast, PodcastMinimal } from '@/types/coreDam/Podcast'
import { fetchPodcastListByIds } from '@/services/api/coreDam/podcastApi'
import type { DocId } from '@anzusystems/common-admin'
import { defineCached } from '@/composables/system/defineCached'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const mapFullToMinimal = (podcast: Podcast): PodcastMinimal => ({
  id: podcast.id,
  title: podcast.texts.title,
})

const mapIdToMinimal = (id: DocId): PodcastMinimal => {
  return { id: id, title: '' }
}

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<DocId, Podcast, PodcastMinimal>(
  mapFullToMinimal,
  mapIdToMinimal,
  (ids) => {
    const { currentExtSystemId } = useCurrentExtSystem()
    return fetchPodcastListByIds(currentExtSystemId.value, ids)
  }
)

export const useCachedPodcasts = () => {
  return {
    addManualToCachedPodcasts: addManual,
    addToCachedPodcasts: add,
    fetchCachedPodcasts: fetch,
    cachedPodcasts: cache,
    hasCachedPodcast: has,
    getCachedPodcast: get,
    isLoadedCachedPodcast: isLoaded,
  }
}
