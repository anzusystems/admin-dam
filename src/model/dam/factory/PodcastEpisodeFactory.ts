import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/podcastEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocIdNullable, IntegerId } from '@/types/common'

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
      },
      dates: {
        publicationDate: null,
      },
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
