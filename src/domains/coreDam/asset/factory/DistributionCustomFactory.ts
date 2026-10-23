import { DamDistributionStatus } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'

import type {
  CustomDistributionUpdateDto,
  DistributionCustomCreateRedistributeDto,
  DistributionItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { DistributionItemResourceName } from '@/domains/coreDam/asset/types/Distribution'

export function useDistributionCustomFactory() {
  const createCreateDto = (): DistributionCustomCreateRedistributeDto => ({
    id: '',
    customData: {},
    distributionService: '',
    blockedBy: [],
    publishAt: null,
  })

  const createCustomUpdateDtoFromItemDto = (item: DistributionItem): CustomDistributionUpdateDto => ({
    id: item.id,
    asset: item.assetId,
    assetFile: item.assetFileId,
    extId: item.extId,
    distributionService: item.distributionService,
    status: item.status,
    _resourceName: DistributionItemResourceName.Custom,
  })

  const createDefaultCustomUpdateDto = (assetId: DocId, assetFileId: DocId): CustomDistributionUpdateDto => ({
    id: '',
    asset: assetId,
    assetFile: assetFileId,
    extId: '',
    distributionService: '',
    status: DamDistributionStatus.Distributed,
    _resourceName: DistributionItemResourceName.Custom,
  })

  return {
    createCreateDto,
    createCustomUpdateDtoFromItemDto,
    createDefaultCustomUpdateDto,
  }
}
