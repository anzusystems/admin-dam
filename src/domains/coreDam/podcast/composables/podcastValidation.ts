import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'

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
        extUrl: {
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
