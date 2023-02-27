import { acceptHMRUpdate, defineStore } from 'pinia'
import { useVideoShowFactory } from '@/model/coreDam/factory/VideoShowFactory'
import type { VideoShow } from '@/types/coreDam/VideoShow'

const { createDefault } = useVideoShowFactory()

interface State {
  videoShow: VideoShow
}

export const useVideoShowOneStore = defineStore('videoShowOneStore', {
  state: (): State => ({
    videoShow: createDefault(0),
  }),
  actions: {
    setVideoShow(videoShow: VideoShow) {
      this.videoShow = videoShow
    },
    reset() {
      this.videoShow = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideoShowOneStore, import.meta.hot))
}
