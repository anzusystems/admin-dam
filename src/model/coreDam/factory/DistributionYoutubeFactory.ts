import type {
  DistributionYoutubeCreateRedistributeDto, DistributionYoutubeItem,
  JwDistributionUpdateDto, YoutubeDistributionUpdateDto
} from '@/types/coreDam/Distribution'
import { DistributionYoutubePrivacyDefault } from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'
import { DamDistributionStatus, type DocId } from '@anzusystems/common-admin'
import { DistributionItemResourceName } from '@/types/coreDam/Distribution'

export function useDistributionYoutubeFactory() {
  const createCreateDto = (): DistributionYoutubeCreateRedistributeDto => {
    return {
      id: '',
      publishAt: null,
      texts: {
        title: '',
        description: '',
        keywords: [],
      },
      distributionService: '',
      privacy: DistributionYoutubePrivacyDefault,
      language: '',
      playlist: '',
      flags: {
        embeddable: false,
        forKids: false,
        notifySubscribers: false,
      },
      blockedBy: [],
    }
  }

  const createYoutubeUpdateDtoFromItemDto = (item: DistributionYoutubeItem): YoutubeDistributionUpdateDto => {
    return {
      id: item.id,
      asset: item.assetId,
      assetFile: item.assetFileId,
      extId: item.extId,
      distributionService: item.distributionService,
      status: item.status,
      _resourceName: DistributionItemResourceName.Youtube
    }
  }

  const createDefaultYoutubeUpdateDto = (assetId: DocId, assetFileId: DocId): YoutubeDistributionUpdateDto => {
    return {
      id: '',
      asset: assetId,
      assetFile: assetFileId,
      extId: '',
      distributionService: '',
      status: DamDistributionStatus.Distributed,
      _resourceName: DistributionItemResourceName.Youtube
    }
  }

  return {
    createCreateDto,
    createYoutubeUpdateDtoFromItemDto,
    createDefaultYoutubeUpdateDto,
  }
}
