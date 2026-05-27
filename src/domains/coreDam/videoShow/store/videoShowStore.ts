import { useVideoShowFactory } from '@/domains/coreDam/videoShow/factory/VideoShowFactory'
import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'

export const useVideoShowOneStore = defineStore('videoShowOneStore', () => {
  const { createDefault } = useVideoShowFactory()

  const videoShow = ref<VideoShow>(createDefault(0))

  function setVideoShow(newVideoShow: VideoShow) {
    videoShow.value = newVideoShow
  }

  function reset() {
    videoShow.value = createDefault(0)
  }

  return {
    videoShow,
    setVideoShow,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideoShowOneStore, import.meta.hot))
}
