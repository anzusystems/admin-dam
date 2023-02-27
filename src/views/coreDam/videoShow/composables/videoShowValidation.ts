import type { Ref } from 'vue'
import { computed } from 'vue'
import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { VideoShow } from '@/types/coreDam/VideoShow'

export function useVideoShowValidation(videoShow: Ref<VideoShow>) {
  const rules = computed(() => ({
    videoShow: {
      texts: {
        title: {
          required,
          minLength: minLength(1),
          maxLength: maxLength(100),
        },
      },
    },
  }))
  const v$ = useVuelidate(rules, { videoShow })

  return {
    v$,
  }
}
