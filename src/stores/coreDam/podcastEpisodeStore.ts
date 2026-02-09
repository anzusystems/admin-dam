import { acceptHMRUpdate, defineStore } from 'pinia'
import { usePodcastEpisodeFactory } from '@/model/coreDam/factory/PodcastEpisodeFactory'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import { ref } from 'vue'

export const usePodcastEpisodeOneStore = defineStore('podcastEpisodeOneStore', () => {
  const { createDefault } = usePodcastEpisodeFactory()

  const podcastEpisode = ref<PodcastEpisode>(createDefault(0))

  function setPodcastEpisode(newPodcastEpisode: PodcastEpisode) {
    podcastEpisode.value = newPodcastEpisode
  }

  function reset() {
    podcastEpisode.value = createDefault(0)
  }

  return {
    podcastEpisode,
    setPodcastEpisode,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastEpisodeOneStore, import.meta.hot))
}
