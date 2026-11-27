import type { IntegerId } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import { usePodcastFactory } from '@/domains/coreDam/podcast/factory/PodcastFactory'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'

export const usePodcastOneStore = defineStore('podcastOneStore', () => {
  const { createDefault } = usePodcastFactory()

  const podcast = ref<Podcast>(createDefault(0))
  /*
   * Export-data rows the server refused as not unique, by row id, with the pair they had then.
   * The server compares each row with the saved ones, so a pair another row gives up in the same save is refused.
   * A row is marked until its pair changes or the podcast is read or saved.
   */
  const exportDataRefused = ref(new Map<IntegerId, string>())

  function setPodcast(newPodcast: Podcast) {
    podcast.value = newPodcast
    exportDataRefused.value = new Map()
  }

  function reset() {
    podcast.value = createDefault(0)
    exportDataRefused.value = new Map()
  }

  return {
    podcast,
    exportDataRefused,
    setPodcast,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastOneStore, import.meta.hot))
}
