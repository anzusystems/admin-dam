import type { Ref } from 'vue'
import { computed } from 'vue'
import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'

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
