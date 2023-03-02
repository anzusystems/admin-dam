import type { DistributionJwCreateRedistributeDto } from '@/types/coreDam/Distribution'

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
      publishAt: null,
    }
  }

  return {
    createCreateDto,
  }
}
