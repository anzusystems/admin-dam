import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'

const { required, maxLength, minLength, minValue, maxValue, url } = useValidate()

export function usePodcastEpisodeValidation(podcastEpisode: Ref<PodcastEpisode>) {
  const rules = computed(() => ({
    podcastEpisode: {
      podcast: {
        required,
      },
      texts: {
        title: {
          required,
          minLength: minLength(1),
          maxLength: maxLength(255),
        },
        description: {
          minLength: minLength(1),
          maxLength: maxLength(2000),
        },
      },
      attributes: {
        seasonNumber: {
          minValue: minValue(1),
          maxValue: maxValue(65535),
        },
        episodeNumber: {
          minValue: minValue(1),
          maxValue: maxValue(65535),
        },
        extId: {
          minLength: minLength(1),
          maxLength: maxLength(256),
        },
        extUrl: {
          maxLength: maxLength(2048),
          url,
        },
        rssUrl: {
          maxLength: maxLength(2048),
          url,
        },
      },
    },
  }))
  const v$ = useVuelidate(rules, { podcastEpisode })

  return {
    v$,
  }
}
