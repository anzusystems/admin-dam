import { useValidate } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed } from 'vue'
import type { Ref } from 'vue'

import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'

const { required, maxLength, minLength, minValue } = useValidate()

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
      attributes: {
        webOrderPosition: {
          required,
          minValue: minValue(0),
        },
        mobileOrderPosition: {
          required,
          minValue: minValue(0),
        },
      },
    },
  }))
  const v$ = useVuelidate(rules, { videoShow })

  return {
    v$,
  }
}
