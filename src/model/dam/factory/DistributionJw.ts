import type { DistributionJwCreateRedistributeDto } from '@/types/dam/Distribution'

export function useDistributionJwFactory() {
  const createCreateDto = (): DistributionJwCreateRedistributeDto => {
    return {
      id: '',
      texts: {
        title: '',
        description: '',
        author: '',
        keywords: [],
      },
      distributionService: '',
      blockedBy: [],
    }
  }

  return {
    createCreateDto,
  }
}
