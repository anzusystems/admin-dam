import { useValidate } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { helpers } from '@vuelidate/validators'
import { computed } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PodcastExportData } from '@/domains/coreDam/podcast/types/PodcastExportData'

const { required } = useValidate()

export const PodcastExportDataValidationSymbol = Symbol.for('podcastExportData')

/** The pair of export type and device type. The server allows each pair once per podcast. */
export const exportDataCombination = (row: Pick<PodcastExportData, 'exportType' | 'deviceType'>) =>
  row.exportType + '/' + row.deviceType

/** Whether another row of the podcast holds the same pair. */
export const exportDataCombinationTaken = (row: PodcastExportData, rows: PodcastExportData[]) =>
  rows.some((other) => other.id !== row.id && exportDataCombination(other) === exportDataCombination(row))

/** `rows`: the podcast's rows, with or without the edited one. */
export function usePodcastExportDataValidation(
  podcastExportData: Ref<PodcastExportData>,
  rows: () => PodcastExportData[] = () => []
) {
  const { t } = useI18n()

  const rules = computed(() => ({
    podcastExportData: {
      exportType: {
        required,
        // At the export type, where the server reports it.
        combinationFree: helpers.withMessage(
          () => t('coreDam.podcastExportData.validation.combinationTaken'),
          () => !exportDataCombinationTaken(podcastExportData.value, rows())
        ),
      },
      deviceType: {
        required,
      },
    },
  }))
  /*
   * Checked by the dialog itself on confirm, so not reported to the page's save. The dialog stays mounted once
   * closed: after a save the server's row holds its row's pair under another id, and the page could never save again.
   * The page checks the rows through the list editor.
   */
  const v$ = useVuelidate(
    rules,
    { podcastExportData },
    { $scope: PodcastExportDataValidationSymbol, $stopPropagation: true }
  )

  return {
    v$,
  }
}
