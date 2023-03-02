import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import type { DocIdNullable, IntegerId } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/podcastEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

export function usePodcastEpisodeFactory() {
  const createDefault = (extSystemId: IntegerId, podcastId: DocIdNullable = null): PodcastEpisode => {
    return {
      id: '',
      podcast: podcastId,
      asset: null,
      texts: {
        title: '',
        description: '',
        rawDescription: '',
      },
      position: 0,
      attributes: {
        seasonNumber: null,
        episodeNumber: null,
        extId: '',
        lastImportStatus: PodcastLastImportStatus.Default,
      },
      dates: {
        publicationDate: null,
      },
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      imagePreview: null,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
