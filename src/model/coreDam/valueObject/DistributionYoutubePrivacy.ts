import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const DistributionYoutubePrivacy = {
  Private: 'private',
  Public: 'public',
  Unlisted: 'unlisted',
  Dynamic: 'dynamic',
} as const

export type DistributionYoutubePrivacyType =
  (typeof DistributionYoutubePrivacy)[keyof typeof DistributionYoutubePrivacy]
export const DistributionYoutubePrivacyDefault = DistributionYoutubePrivacy.Private

export function useDistributionYoutubePrivacy() {
  const { t } = useI18n()

  const distributionYoutubePrivacyOptions = ref<ValueObjectOption<DistributionYoutubePrivacyType>[]>([
    {
      value: DistributionYoutubePrivacy.Private,
      title: t('coreDam.youtubeDistribution.privacy.private'),
    },
    {
      value: DistributionYoutubePrivacy.Public,
      title: t('coreDam.youtubeDistribution.privacy.public'),
    },
    {
      value: DistributionYoutubePrivacy.Unlisted,
      title: t('coreDam.youtubeDistribution.privacy.unlisted'),
    },
    {
      value: DistributionYoutubePrivacy.Dynamic,
      title: t('coreDam.youtubeDistribution.privacy.dynamic'),
    },
  ])

  const getDistributionYoutubePrivacyOption = (value: DistributionYoutubePrivacyType) => {
    return distributionYoutubePrivacyOptions.value.find((item) => item.value === value)
  }

  return {
    distributionYoutubePrivacyOptions,
    getDistributionYoutubePrivacyOption,
  }
}
