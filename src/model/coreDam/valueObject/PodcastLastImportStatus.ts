import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const PodcastLastImportStatus = {
  NotImported: 'not_imported',
  Imported: 'imported',
  ImportFailed: 'import_failed',
} as const

export type PodcastLastImportStatusType = (typeof PodcastLastImportStatus)[keyof typeof PodcastLastImportStatus]
export const PodcastLastImportStatusDefault = PodcastLastImportStatus.NotImported

export function usePodcastLastImportStatus() {
  const { t } = useI18n()

  const podcastLastImportStatusOptions = ref<ValueObjectOption<PodcastLastImportStatusType>[]>([
    {
      value: PodcastLastImportStatus.NotImported,
      title: t('coreDam.podcast.lastImportStatus.notImported'),
    },
    {
      value: PodcastLastImportStatus.Imported,
      title: t('coreDam.podcast.lastImportStatus.imported'),
    },
    {
      value: PodcastLastImportStatus.ImportFailed,
      title: t('coreDam.podcast.lastImportStatus.importFailed'),
    },
  ])

  const getPodcastLastImportStatusOption = (value: PodcastLastImportStatusType) => {
    return podcastLastImportStatusOptions.value.find((item) => item.value === value)
  }

  return {
    podcastLastImportStatusOptions,
    getPodcastLastImportStatusOption,
  }
}
