import type { DistributionYoutubeCreateRedistributeDto } from '@/types/coreDam/Distribution'
import { DistributionYoutubePrivacyDefault } from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'

export function useDistributionYoutubeFactory() {
  const createCreateDto = (): DistributionYoutubeCreateRedistributeDto => {
    return {
      id: '',
      publishAt: null,
      texts: {
        title: '',
        description: '',
        keywords: [],
      },
      distributionService: '',
      privacy: DistributionYoutubePrivacyDefault,
      language: '',
      playlist: '',
      flags: {
        embeddable: false,
        forKids: false,
        notifySubscribers: false,
      },
      blockedBy: [],
    }
  }

  return {
    createCreateDto,
  }
}
