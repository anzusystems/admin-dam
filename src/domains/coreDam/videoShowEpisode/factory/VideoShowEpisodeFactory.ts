import { dateTimeNow } from '@anzusystems/common-admin'
import type { DocIdNullable, IntegerId } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/videoShowEpisode/api/videoShowEpisodeApi'
import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useVideoShowEpisodeFactory() {
  const createDefault = (extSystemId: IntegerId, videoShowId: DocIdNullable = null): VideoShowEpisode => {
    return {
      id: '',
      videoShow: videoShowId,
      asset: null,
      texts: {
        title: '',
      },
      attributes: {
        webOrderPosition: 0,
        mobileOrderPosition: 0,
      },
      flags: {
        webPublicExportEnabled: false,
        mobilePublicExportEnabled: false,
      },
      dates: {
        publicationDate: dateTimeNow(),
      },
      position: 0,
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
