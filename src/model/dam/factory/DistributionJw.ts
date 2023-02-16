import type { DistributionJwCreateDto } from '@/types/dam/Distribution'

export function useDistributionJwFactory() {
  const createCreateDto = (): DistributionJwCreateDto => {
    return {
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
