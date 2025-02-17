import type { Podcast } from '@/types/coreDam/Podcast'
import type { IntegerIdNullable } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/podcastApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { PodcastModeDefault } from '@/model/coreDam/valueObject/PodcastMode'
import { PodcastLastImportStatusDefault } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

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
