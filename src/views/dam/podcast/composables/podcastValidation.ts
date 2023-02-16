import type { Ref } from 'vue'
import { computed } from 'vue'
import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { Podcast } from '@/types/dam/Podcast'

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
    },
  }))
  const v$ = useVuelidate(rules, { podcast })

  return {
    v$,
  }
}
