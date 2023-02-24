import type { Podcast } from '@/types/dam/Podcast'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/dam/podcastApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { IntegerIdNullable } from '@anzusystems/common-admin'
import { PodcastMode } from '@/model/dam/valueObject/PodcastMode'
import { PodcastLastImportStatus } from '@/model/dam/valueObject/PodcastLastImportStatus'

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
        mode: PodcastMode.Default,
        lastImportStatus: PodcastLastImportStatus.Default,
      },
      links: undefined,
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
