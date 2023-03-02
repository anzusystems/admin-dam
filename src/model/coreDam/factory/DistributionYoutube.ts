import type { DistributionYoutubeCreateRedistributeDto } from '@/types/coreDam/Distribution'
import { DistributionYoutubePrivacy } from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'

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
      privacy: DistributionYoutubePrivacy.Default,
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
