import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { Podcast } from '@/types/coreDam/Podcast'
import { useValidate } from '@anzusystems/common-admin'

const { required, maxLength, minLength } = useValidate()

export function usePodcastValidation(podcast: Ref<Podcast>) {
  const rules = computed(() => ({
    podcast: {
      texts: {
        title: {
          required,
          minLength: minLength(1),
          maxLength: maxLength(100),
        },
        description: {
          minLength: minLength(1),
          maxLength: maxLength(2000),
        },
      },
      attributes: {
        rssUrl: {
          minLength: minLength(1),
          maxLength: maxLength(2048),
        },
      },
      dates: {
        importFrom: {},
      },
    },
  }))
  const v$ = useVuelidate(rules, { podcast })

  return {
    v$,
  }
}
