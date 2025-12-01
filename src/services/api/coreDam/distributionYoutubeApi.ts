import type { DamDistributionServiceName, DocId } from '@anzusystems/common-admin'
import {
  apiCreateOne,
  apiFetchList,
  apiFetchOne,
  apiUpdateOne,
  booleanToInteger,
  usePagination,
} from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  DistributionAuthUrl,
  DistributionYoutubeCreateRedistributeDto,
  DistributionYoutubeItem,
  YoutubeLanguage,
  YoutubePlaylist,
} from '@/types/coreDam/Distribution'

const END_POINT = '/adm/v1/youtube-distribution'
export const ENTITY = 'youtubeDistribution'

export const createYoutubeDistribution = (assetFileId: DocId, data: DistributionYoutubeCreateRedistributeDto) =>
  apiCreateOne<DistributionYoutubeCreateRedistributeDto>(
    damClient,
    data,
    END_POINT + '/asset-file/:assetFileId/distribute',
    { assetFileId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const redistributeYoutubeDistribution = (
  distributionId: DocId,
  data: DistributionYoutubeCreateRedistributeDto
) =>
  apiUpdateOne<DistributionYoutubeCreateRedistributeDto>(
    damClient,
    data,
    END_POINT + '/:distributionId/redistribute',
    { distributionId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataYoutubeDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) =>
  apiFetchOne<DistributionYoutubeItem>(
    damClient,
    END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
    { assetFileId, distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const getYoutubeAuthUrl = (distributionServiceName: DamDistributionServiceName) =>
  apiFetchOne<DistributionAuthUrl>(
    damClient,
    END_POINT + '/:distributionServiceName/auth-url',
    { distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchYoutubeLanguages = (distributionServiceName: DamDistributionServiceName) => {
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

export const fetchYoutubePlaylists = (distributionServiceName: DamDistributionServiceName, forceReload = false) => {
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

export const logoutYoutube = (distributionServiceName: DamDistributionServiceName) =>
  apiFetchOne(
    damClient,
    END_POINT + '/:distributionServiceName/logout',
    { distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )
