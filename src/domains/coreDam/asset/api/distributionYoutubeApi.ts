import {
  booleanToInteger,
  createFilter,
  createFilterStore,
  useApiCommand,
  useApiFetchList,
  useApiRequest,
  usePagination,
} from '@anzusystems/common-admin'
import type { DamDistributionServiceName, DocId, MakeFilterOption } from '@anzusystems/common-admin'

import type {
  DistributionAuthUrl,
  DistributionYoutubeCreateRedistributeDto,
  DistributionYoutubeItem,
  YoutubeLanguage,
  YoutubePlaylist,
} from '@/domains/coreDam/asset/types/Distribution'
import { damApiBase } from '@/shared/apiClients/damApiBase'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/youtube-distribution'
export const ENTITY = 'youtubeDistribution'

const emptyFilterFields = [] satisfies readonly MakeFilterOption[]
const emptyFilterStore = createFilterStore(emptyFilterFields)

export const useCreateYoutubeDistribution = () =>
  useApiRequest<DistributionYoutubeCreateRedistributeDto, DistributionYoutubeCreateRedistributeDto>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/distribute',
  })

export const createYoutubeDistribution = (assetFileId: DocId, data: DistributionYoutubeCreateRedistributeDto) => {
  const { execute } = useCreateYoutubeDistribution()
  return execute({ urlParams: { assetFileId }, body: data })
}

export const useRedistributeYoutubeDistribution = () =>
  useApiRequest<DistributionYoutubeCreateRedistributeDto, DistributionYoutubeCreateRedistributeDto>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId/redistribute',
  })

export const redistributeYoutubeDistribution = (
  distributionId: DocId,
  data: DistributionYoutubeCreateRedistributeDto
) => {
  const { execute } = useRedistributeYoutubeDistribution()
  return execute({ urlParams: { distributionId }, body: data })
}

export const usePrepareFormDataYoutubeDistribution = () =>
  useApiRequest<DistributionYoutubeItem, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
  })

export const prepareFormDataYoutubeDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) => {
  const { execute } = usePrepareFormDataYoutubeDistribution()
  return execute({ urlParams: { assetFileId, distributionServiceName } })
}

export const useGetYoutubeAuthUrl = () =>
  useApiRequest<DistributionAuthUrl, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/auth-url',
  })

export const getYoutubeAuthUrl = (distributionServiceName: DamDistributionServiceName, signal?: AbortSignal) => {
  const { execute } = useGetYoutubeAuthUrl()
  return execute({ urlParams: { distributionServiceName }, signal })
}

export const useFetchYoutubeLanguages = () =>
  useApiFetchList<YoutubeLanguage>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/language',
  })

export const fetchYoutubeLanguages = (distributionServiceName: DamDistributionServiceName) => {
  const { pagination } = usePagination(null)
  const { filterConfig, filterData } = createFilter(emptyFilterFields, emptyFilterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
  const { execute } = useFetchYoutubeLanguages()
  return execute(pagination, filterData, filterConfig, { urlParams: { distributionServiceName } })
}

export const useFetchYoutubePlaylists = () =>
  useApiFetchList<YoutubePlaylist>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/playlist/:forceReload',
  })

export const fetchYoutubePlaylists = (distributionServiceName: DamDistributionServiceName, forceReload = false) => {
  const { pagination } = usePagination(null)
  const { filterConfig, filterData } = createFilter(emptyFilterFields, emptyFilterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
  const { execute } = useFetchYoutubePlaylists()
  return execute(pagination, filterData, filterConfig, {
    urlParams: { distributionServiceName, forceReload: booleanToInteger(forceReload) },
  })
}

export const useLogoutYoutube = () =>
  useApiCommand<null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/logout',
  })

export const logoutYoutube = (distributionServiceName: DamDistributionServiceName) => {
  const { execute } = useLogoutYoutube()
  return execute({ urlParams: { distributionServiceName } })
}
