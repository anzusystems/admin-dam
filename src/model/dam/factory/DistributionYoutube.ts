import type { DistributionYoutubeCreateRedistributeDto } from '@/types/dam/Distribution'
import { DistributionYoutubePrivacy } from '@/model/dam/valueObject/DistributionYoutubePrivacy'

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
