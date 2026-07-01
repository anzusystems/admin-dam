import type { Podcast, PodcastMinimal } from '@/domains/coreDam/podcast/types/Podcast'
import { useFetchPodcastListByIds } from '@/domains/coreDam/podcast/api/podcastApi'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'

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
    const { executeFetch } = useFetchPodcastListByIds()
    return executeFetch(ids, { urlParams: { extSystemId: currentExtSystemId.value } })
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
