import type {
  CustomDistributionUpdateDto,
  DistributionCustomCreateRedistributeDto,
  DistributionItem,
} from '@/types/coreDam/Distribution'
import { DistributionItemResourceName } from '@/types/coreDam/Distribution'
import { DamDistributionStatus, type DocId } from '@anzusystems/common-admin'

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

  const createCustomUpdateDtoFromItemDto = (item: DistributionItem): CustomDistributionUpdateDto => {
    return {
      id: item.id,
      asset: item.assetId,
      assetFile: item.assetFileId,
      extId: item.extId,
      distributionService: item.distributionService,
      status: item.status,
      _resourceName: DistributionItemResourceName.Custom,
    }
  }

  const createDefaultCustomUpdateDto = (assetId: DocId, assetFileId: DocId): CustomDistributionUpdateDto => {
    return {
      id: '',
      asset: assetId,
      assetFile: assetFileId,
      extId: '',
      distributionService: '',
      status: DamDistributionStatus.Distributed,
      _resourceName: DistributionItemResourceName.Custom,
    }
  }

  return {
    createCreateDto,
    createCustomUpdateDtoFromItemDto,
    createDefaultCustomUpdateDto,
  }
}
