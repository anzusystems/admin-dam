import type { DistributionCustomCreateRedistributeDto } from '@/types/coreDam/Distribution'

export function useDistributionCustomFactory() {
  const createCreateDto = (): DistributionCustomCreateRedistributeDto => {
    return {
      id: '',
      customData: {},
      distributionService: '',
      blockedBy: [],
      publishAt: null,
    }
  }

  return {
    createCreateDto,
  }
}
