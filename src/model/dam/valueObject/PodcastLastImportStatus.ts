import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum PodcastLastImportStatus {
  NotImported = 'not_imported',
  Imported = 'imported',
  ImportFailed = 'import_failed',
  Default = NotImported,
}

export function usePodcastLastImportStatus() {
  const { t } = useI18n({ useScope: 'global' })

  const podcastLastImportStatusOptions = ref<ValueObjectOption<PodcastLastImportStatus>[]>([
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

  const getPodcastLastImportStatusOption = (value: PodcastLastImportStatus) => {
    return podcastLastImportStatusOptions.value.find((item) => item.value === value)
  }

  return {
    podcastLastImportStatusOptions,
    getPodcastLastImportStatusOption,
  }
}
