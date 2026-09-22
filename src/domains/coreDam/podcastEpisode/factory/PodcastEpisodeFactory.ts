import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'
import { ENTITY } from '@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { PodcastLastImportStatusDefault } from '@/domains/coreDam/podcast/valueObject/PodcastLastImportStatus'

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
      flags: {
        fromRss: false,
        webPublicExportEnabled: false,
        mobilePublicExportEnabled: false,
      },
      position: 0,
      attributes: {
        seasonNumber: null,
        episodeNumber: null,
        webOrderPosition: 0,
        duration: 0,
        mobileOrderPosition: 0,
        extId: '',
        rssUrl: '',
        extUrl: '',
        lastImportStatus: PodcastLastImportStatusDefault,
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
