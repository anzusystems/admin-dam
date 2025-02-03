import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const PodcastMode = {
  Import: 'import',
  NotImport: 'not_import',
} as const

export type PodcastModeType = (typeof PodcastMode)[keyof typeof PodcastMode]
export const PodcastModeDefault = PodcastMode.Import

export function usePodcastMode() {
  const { t } = useI18n()

  const podcastModeOptions = ref<ValueObjectOption<PodcastModeType>[]>([
    {
      value: PodcastMode.Import,
      title: t('coreDam.podcast.podcastMode.import'),
    },
    {
      value: PodcastMode.NotImport,
      title: t('coreDam.podcast.podcastMode.notImport'),
    },
  ])

  const getPodcastModeOption = (value: PodcastModeType) => {
    return podcastModeOptions.value.find((item) => item.value === value)
  }

  return {
    podcastModeOptions,
    getPodcastModeOption,
  }
}
