import type { DistributionYoutubeCreateDto } from '@/types/dam/Distribution'
import { DistributionYoutubePrivacy } from '@/model/dam/valueObject/DistributionYoutubePrivacy'

export function useDistributionYoutubeFactory() {
  const createCreateDto = (): DistributionYoutubeCreateDto => {
    return {
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
    }
  }

  return {
    createCreateDto,
  }
}
