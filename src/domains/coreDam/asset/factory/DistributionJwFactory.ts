import type {
  DistributionJwCreateRedistributeDto,
  DistributionJwItem,
  JwDistributionUpdateDto,
} from '@/domains/coreDam/asset/types/Distribution'
import { DistributionItemResourceName } from '@/domains/coreDam/asset/types/Distribution'
import { DamDistributionStatus } from '@anzusystems/common-admin'

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

  const createDefaultUpdateDto = (assetId: DocId, assetFileId: DocId): JwDistributionUpdateDto => {
    return {
      id: '',
      asset: assetId,
      assetFile: assetFileId,
      directSourceUrl: '',
      extId: '',
      distributionService: '',
      status: DamDistributionStatus.Distributed,
      _resourceName: DistributionItemResourceName.Jw,
    }
  }

  const createJwUpdateDtoFromItemDto = (item: DistributionJwItem): JwDistributionUpdateDto => {
    return {
      id: item.id,
      asset: item.assetId,
      assetFile: item.assetFileId,
      directSourceUrl: item.directSourceUrl,
      extId: item.extId,
      distributionService: item.distributionService,
      status: item.status,
      _resourceName: DistributionItemResourceName.Jw,
    }
  }

  return {
    createCreateDto,
    createDefaultUpdateDto,
    createJwUpdateDtoFromItemDto,
  }
}
