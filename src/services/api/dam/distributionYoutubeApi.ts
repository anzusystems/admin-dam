import { apiCreateOne, apiFetchList, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId } from '@anzusystems/common-admin'
import type { DistributionServiceName } from '@/types/dam/DamConfig'
import type {
  DistributionAuthUrl,
  DistributionYoutubeCreateDto,
  DistributionYoutubeItem,
  YoutubeLanguage,
  YoutubePlaylist,
} from '@/types/dam/Distribution'
import { booleanToInteger } from '@/utils/bool'
import { usePagination } from '@/composables/system/pagination'

const END_POINT = '/adm/v1/youtube-distribution'
export const ENTITY = 'youtubeDistribution'

export const createYoutubeDistribution = (assetFileId: DocId, data: DistributionYoutubeCreateDto) =>
  apiCreateOne<DistributionYoutubeCreateDto>(
    damClient,
    data,
    END_POINT + '/asset-file/:assetFileId/distribute',
    { assetFileId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const redistributeYoutubeDistribution = (distributionId: DocId, data: DistributionYoutubeCreateDto) =>
  apiUpdateOne<DistributionYoutubeCreateDto>(
    damClient,
    data,
    END_POINT + '/:distributionId/redistribute',
    { distributionId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataYoutubeDistribution = (
  assetFileId: DocId,
  distributionServiceName: DistributionServiceName
) =>
  apiFetchOne<DistributionYoutubeItem>(
    damClient,
    END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
    { assetFileId, distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const getYoutubeAuthUrl = (distributionServiceName: DistributionServiceName) =>
  apiFetchOne<DistributionAuthUrl>(
    damClient,
    END_POINT + '/:distributionServiceName/auth-url',
    { distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchYoutubeLanguages = (distributionServiceName: DistributionServiceName) => {
  const pagination = usePagination()
  return apiFetchList<YoutubeLanguage[]>(
    damClient,
    END_POINT + '/:distributionServiceName/language',
    { distributionServiceName },
    pagination,
    {},
    SYSTEM_CORE_DAM,
    ENTITY
  )
}

export const fetchYoutubePlaylists = (distributionServiceName: DistributionServiceName, forceReload = false) => {
  const pagination = usePagination()
  return apiFetchList<YoutubePlaylist[]>(
    damClient,
    END_POINT + '/:distributionServiceName/playlist/:forceReload',
    { distributionServiceName, forceReload: booleanToInteger(forceReload) },
    pagination,
    {},
    SYSTEM_CORE_DAM,
    ENTITY
  )
}
