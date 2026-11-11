import { useValidate } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed } from 'vue'
import type { Ref } from 'vue'

import type { PodcastExportData } from '@/domains/coreDam/podcast/types/PodcastExportData'

const { required } = useValidate()

export const PodcastExportDataValidationSymbol = Symbol.for('podcastExportData')

export function usePodcastExportDataValidation(podcastExportData: Ref<PodcastExportData>) {
  const rules = computed(() => ({
    podcastExportData: {
      exportType: {
        required,
      },
      deviceType: {
        required,
      },
    },
  }))
  const v$ = useVuelidate(rules, { podcastExportData }, { $scope: PodcastExportDataValidationSymbol })

  return {
    v$,
  }
}
