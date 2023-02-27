import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import {
  useValidateMaxLength,
  useValidateMaxValue,
  useValidateMinLength,
  useValidateMinValue,
  useValidateRequired,
} from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()
const maxLength = useValidateMaxLength()
const minValue = useValidateMinValue()
const maxValue = useValidateMaxValue()

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
