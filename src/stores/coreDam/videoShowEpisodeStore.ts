import { useVideoShowEpisodeFactory } from '@/model/coreDam/factory/VideoShowEpisodeFactory'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'

export const useVideoShowEpisodeOneStore = defineStore('videoShowEpisodeOneStore', () => {
  const { createDefault } = useVideoShowEpisodeFactory()

  const videoShowEpisode = ref<VideoShowEpisode>(createDefault(0))

  function setVideoShowEpisode(newVideoShowEpisode: VideoShowEpisode) {
    videoShowEpisode.value = newVideoShowEpisode
  }

  function reset() {
    videoShowEpisode.value = createDefault(0)
  }

  return {
    videoShowEpisode,
    setVideoShowEpisode,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideoShowEpisodeOneStore, import.meta.hot))
}
