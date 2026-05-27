import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'
import { ENTITY } from '@/domains/coreDam/podcast/api/podcastApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { PodcastModeDefault } from '@/domains/coreDam/podcast/valueObject/PodcastMode'
import { PodcastLastImportStatusDefault } from '@/domains/coreDam/podcast/valueObject/PodcastLastImportStatus'

export function usePodcastFactory() {
  const createDefault = (licenceId: IntegerIdNullable = null): Podcast => {
    return {
      id: '',
      licence: licenceId,
      texts: {
        title: '',
        description: '',
      },
      attributes: {
        rssUrl: '',
        extUrl: '',
        mode: PodcastModeDefault,
        lastImportStatus: PodcastLastImportStatusDefault,
        webOrderPosition: 0,
        mobileOrderPosition: 0,
      },
      exportData: [],
      flags: {
        webPublicExportEnabled: false,
        mobilePublicExportEnabled: false,
      },
      dates: {
        importFrom: null,
      },
      links: undefined,
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      imagePreview: null,
      altImage: null,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
