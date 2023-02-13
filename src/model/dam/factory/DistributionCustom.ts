import type { DistributionCustomCreateDto } from '@/types/dam/Distribution'

export function useDistributionCustomFactory() {
  const createCreateDto = (): DistributionCustomCreateDto => {
    return {
      customData: {},
      distributionService: '',
    }
  }

  return {
    createCreateDto,
  }
}
