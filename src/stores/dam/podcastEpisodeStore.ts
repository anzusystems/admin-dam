import { acceptHMRUpdate, defineStore } from 'pinia'
import { usePodcastEpisodeFactory } from '@/model/dam/factory/PodcastEpisodeFactory'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'

const { createDefault } = usePodcastEpisodeFactory()

interface State {
  podcastEpisode: PodcastEpisode
}

export const usePodcastEpisodeOneStore = defineStore('podcastEpisodeOneStore', {
  state: (): State => ({
    podcastEpisode: createDefault(0),
  }),
  actions: {
    setPodcastEpisode(podcastEpisode: PodcastEpisode) {
      this.podcastEpisode = podcastEpisode
    },
    reset() {
      this.podcastEpisode = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastEpisodeOneStore, import.meta.hot))
}
