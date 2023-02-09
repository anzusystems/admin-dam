import { acceptHMRUpdate, defineStore } from 'pinia'
import { useVideoShowEpisodeFactory } from '@/model/dam/factory/VideoShowEpisodeFactory'
import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'

const { createDefault } = useVideoShowEpisodeFactory()

interface State {
  videoShowEpisode: VideoShowEpisode
}

export const useVideoShowEpisodeOneStore = defineStore('videoShowEpisodeOneStore', {
  state: (): State => ({
    videoShowEpisode: createDefault(0),
  }),
  actions: {
    setVideoShowEpisode(videoShowEpisode: VideoShowEpisode) {
      this.videoShowEpisode = videoShowEpisode
    },
    reset() {
      this.videoShowEpisode = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideoShowEpisodeOneStore, import.meta.hot))
}
