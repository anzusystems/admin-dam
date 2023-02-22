import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum DistributionYoutubePrivacy {
  Private = 'private',
  Public = 'public',
  Unlisted = 'unlisted',
  Dynamic = 'dynamic',
  Default = Private,
}

export function useDistributionYoutubePrivacy() {
  const { t } = useI18n()

  const distributionYoutubePrivacyOptions = ref<ValueObjectOption<DistributionYoutubePrivacy>[]>([
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

  const getDistributionYoutubePrivacyOption = (value: DistributionYoutubePrivacy) => {
    return distributionYoutubePrivacyOptions.value.find((item) => item.value === value)
  }

  return {
    distributionYoutubePrivacyOptions,
    getDistributionYoutubePrivacyOption,
  }
}
