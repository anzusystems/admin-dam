import { acceptHMRUpdate, defineStore } from 'pinia'
import { usePodcastEpisodeFactory } from '@/model/dam/factory/PodcastEpisodeFactory'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'

const { createDefault } = usePodcastEpisodeFactory()

interface State {
  podcastEpisode: PodcastEpisode
  loaded: boolean
}

export const usePodcastEpisodeOneStore = defineStore('podcastEpisodeOneStore', {
  state: (): State => ({
    podcastEpisode: createDefault(0),
    loaded: false,
  }),
  actions: {
    setPodcastEpisode(podcastEpisode: PodcastEpisode) {
      this.podcastEpisode = podcastEpisode
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.podcastEpisode = createDefault(0)
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastEpisodeOneStore, import.meta.hot))
}
