import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum PodcastMode {
  Import = 'import',
  NotImport = 'not_import',
  Default = Import,
}

export function usePodcastMode() {
  const { t } = useI18n({ useScope: 'global' })

  const podcastModeOptions = ref<ValueObjectOption<PodcastMode>[]>([
    {
      value: PodcastMode.Import,
      title: t('coreDam.podcast.podcastMode.import'),
    },
    {
      value: PodcastMode.NotImport,
      title: t('coreDam.podcast.podcastMode.notImport'),
    },
  ])

  const getPodcastModeOption = (value: PodcastMode) => {
    return podcastModeOptions.value.find((item) => item.value === value)
  }

  return {
    podcastModeOptions,
    getPodcastModeOption,
  }
}
