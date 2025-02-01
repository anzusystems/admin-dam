import type {
  DistributionCustomCreateRedistributeDto,
  CustomDistributionUpdateDto, JwDistributionUpdateDto
} from '@/types/coreDam/Distribution'
import { DamDistributionStatus, type DocId } from '@anzusystems/common-admin'
import { DistributionItemResourceName } from '@/types/coreDam/Distribution'

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

  const createCustomUpdateDtoFromItemDto = (item: DistributionCustomCreateRedistributeDto): CustomDistributionUpdateDto => {
    return {
      id: item.id,
      asset: item.assetId,
      assetFile: item.assetFileId,
      extId: item.extId,
      distributionService: item.distributionService,
      status: DamDistributionStatus.Distributed,
      _resourceName: DistributionItemResourceName.Custom
    }
  }

  const createDefaultCustomUpdateDto = (assetId: DocId, assetFileId: DocId): JwDistributionUpdateDto => {
    return {
      id: '',
      asset: assetId,
      assetFile: assetFileId,
      extId: '',
      distributionService: '',
      status: DamDistributionStatus.Distributed,
      _resourceName: DistributionItemResourceName.Custom
    }
  }

  return {
    createCreateDto,
    createCustomUpdateDtoFromItemDto,
    createDefaultCustomUpdateDto,
  }
}
