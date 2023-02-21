import type { DistributionCustomCreateRedistributeDto } from '@/types/dam/Distribution'

export function useDistributionCustomFactory() {
  const createCreateDto = (): DistributionCustomCreateRedistributeDto => {
    return {
      id: '',
      customData: {},
      distributionService: '',
      blockedBy: [],
    }
  }

  return {
    createCreateDto,
  }
}
