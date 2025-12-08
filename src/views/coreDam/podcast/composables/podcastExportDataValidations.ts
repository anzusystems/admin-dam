import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { PodcastExportData } from '@/types/coreDam/PodcastExportData'
import { useValidate } from '@anzusystems/common-admin'

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
