import type { Podcast } from '@/types/coreDam/Podcast'
import type { IntegerIdNullable } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/podcastApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { PodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

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
        mode: PodcastMode.Default,
        lastImportStatus: PodcastLastImportStatus.Default,
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
