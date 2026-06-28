import { usePodcastFactory } from '@/domains/coreDam/podcast/factory/PodcastFactory'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'
import { sortByPosition } from '@anzusystems/common-admin/labs'

export const usePodcastOneStore = defineStore('podcastOneStore', () => {
  const { createDefault } = usePodcastFactory()

  const podcast = ref<Podcast>(createDefault(0))

  function setPodcast(newPodcast: Podcast) {
    // The sortable export-data editor renders in array order, so normalise to `position` at ingress.
    newPodcast.exportData = sortByPosition(newPodcast.exportData)
    podcast.value = newPodcast
  }

  function reset() {
    podcast.value = createDefault(0)
  }

  return {
    podcast,
    setPodcast,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastOneStore, import.meta.hot))
}
