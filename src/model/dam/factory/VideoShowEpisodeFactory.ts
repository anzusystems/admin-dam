import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/dam/videoShowEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocIdNullable, IntegerId } from '@anzusystems/common-admin'

export function useVideoShowEpisodeFactory() {
  const createDefault = (extSystemId: IntegerId, videoShowId: DocIdNullable = null): VideoShowEpisode => {
    return {
      id: '',
      videoShow: videoShowId,
      asset: null,
      texts: {
        title: '',
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
