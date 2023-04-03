import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import { useValidate } from '@anzusystems/common-admin'

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
