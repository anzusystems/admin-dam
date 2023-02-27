import { acceptHMRUpdate, defineStore } from 'pinia'
import { usePodcastFactory } from '@/model/coreDam/factory/PodcastFactory'
import type { Podcast } from '@/types/coreDam/Podcast'

const { createDefault } = usePodcastFactory()

interface State {
  podcast: Podcast
}

export const usePodcastOneStore = defineStore('podcastOneStore', {
  state: (): State => ({
    podcast: createDefault(0),
  }),
  actions: {
    setPodcast(podcast: Podcast) {
      this.podcast = podcast
    },
    reset() {
      this.podcast = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePodcastOneStore, import.meta.hot))
}
