import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { Podcast } from '@/types/coreDam/Podcast'
import { useValidateMaxLength, useValidateMinLength, useValidateRequired } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()
const maxLength = useValidateMaxLength()

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
          maxLength: maxLength(100),
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
