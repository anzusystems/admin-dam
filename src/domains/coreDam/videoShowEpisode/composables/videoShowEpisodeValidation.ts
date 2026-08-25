import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'

const { required, maxLength, minLength } = useValidate()

export function useVideoShowEpisodeValidation(videoShowEpisode: Ref<VideoShowEpisode>) {
  const rules = computed(() => ({
    videoShowEpisode: {
      videoShow: {
        required,
      },
      texts: {
        title: {
          required,
          minLength: minLength(1),
          maxLength: maxLength(255),
        },
      },
    },
  }))
  const v$ = useVuelidate(rules, { videoShowEpisode })

  return {
    v$,
  }
}
