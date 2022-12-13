import { acceptHMRUpdate, defineStore } from 'pinia'
import { usePodcastFactory } from '@/model/dam/factory/PodcastFactory'
import type { Podcast } from '@/types/dam/Podcast'

const { createDefault } = usePodcastFactory()

interface State {
  podcast: Podcast
  loaded: boolean
}

export const usePodcastOneStore = defineStore('podcastOneStore', {
  state: (): State => ({
    podcast: createDefault(0),
    loaded: false,
  }),
  actions: {
    setPodcast(podcast: Podcast) {
      this.podcast = podcast
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.podcast = createDefault(0)
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastOneStore, import.meta.hot))
}
