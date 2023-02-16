import type { Ref } from 'vue'
import { computed } from 'vue'
import { maxLength, maxValue, minLength, minValue, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'

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
      },
    },
  }))
  const v$ = useVuelidate(rules, { podcastEpisode })

  return {
    v$,
  }
}
