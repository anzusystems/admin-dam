import type { PodcastExportData } from '@/types/coreDam/PodcastExportData'

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
