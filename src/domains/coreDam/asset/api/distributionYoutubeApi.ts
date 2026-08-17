import { booleanToInteger, type DamDistributionServiceName } from '@anzusystems/common-admin'
import {
  createFilter,
  createFilterStore,
  type MakeFilterOption,
  useApiFetchList,
  useApiRequest,
  usePagination,
} from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  DistributionAuthUrl,
  DistributionYoutubeCreateRedistributeDto,
  DistributionYoutubeItem,
  YoutubeLanguage,
  YoutubePlaylist,
} from '@/domains/coreDam/asset/types/Distribution'

const END_POINT = '/adm/v1/youtube-distribution'
export const ENTITY = 'youtubeDistribution'

const emptyFilterFields = [] satisfies readonly MakeFilterOption[]
const emptyFilterStore = createFilterStore(emptyFilterFields)

export const useCreateYoutubeDistribution = () =>
  useApiRequest<DistributionYoutubeCreateRedistributeDto, DistributionYoutubeCreateRedistributeDto>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/distribute',
  })

export const createYoutubeDistribution = (assetFileId: DocId, data: DistributionYoutubeCreateRedistributeDto) => {
  const { executeRequest } = useCreateYoutubeDistribution()
  return executeRequest({ urlParams: { assetFileId }, object: data })
}

export const useRedistributeYoutubeDistribution = () =>
  useApiRequest<DistributionYoutubeCreateRedistributeDto, DistributionYoutubeCreateRedistributeDto>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId/redistribute',
  })

export const redistributeYoutubeDistribution = (
  distributionId: DocId,
  data: DistributionYoutubeCreateRedistributeDto
) => {
  const { executeRequest } = useRedistributeYoutubeDistribution()
  return executeRequest({ urlParams: { distributionId }, object: data })
}

export const usePrepareFormDataYoutubeDistribution = () =>
  useApiRequest<DistributionYoutubeItem, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
  })

export const prepareFormDataYoutubeDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) => {
  const { executeRequest } = usePrepareFormDataYoutubeDistribution()
  return executeRequest({ urlParams: { assetFileId, distributionServiceName } })
}

export const useGetYoutubeAuthUrl = () =>
  useApiRequest<DistributionAuthUrl, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/auth-url',
  })

export const getYoutubeAuthUrl = (distributionServiceName: DamDistributionServiceName) => {
  const { executeRequest } = useGetYoutubeAuthUrl()
  return executeRequest({ urlParams: { distributionServiceName } })
}

export const useFetchYoutubeLanguages = () =>
  useApiFetchList<YoutubeLanguage[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/language',
  })

export const fetchYoutubeLanguages = (distributionServiceName: DamDistributionServiceName) => {
  const { pagination } = usePagination(null)
  const { filterConfig, filterData } = createFilter(emptyFilterFields, emptyFilterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
  const { executeFetch } = useFetchYoutubeLanguages()
  return executeFetch(pagination, filterData, filterConfig, { urlParams: { distributionServiceName } })
}

export const useFetchYoutubePlaylists = () =>
  useApiFetchList<YoutubePlaylist[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/playlist/:forceReload',
  })

export const fetchYoutubePlaylists = (distributionServiceName: DamDistributionServiceName, forceReload = false) => {
  const { pagination } = usePagination(null)
  const { filterConfig, filterData } = createFilter(emptyFilterFields, emptyFilterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
  const { executeFetch } = useFetchYoutubePlaylists()
  return executeFetch(pagination, filterData, filterConfig, {
    urlParams: { distributionServiceName, forceReload: booleanToInteger(forceReload) },
  })
}

export const useLogoutYoutube = () =>
  useApiRequest<unknown, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/logout',
  })

export const logoutYoutube = (distributionServiceName: DamDistributionServiceName) => {
  const { executeRequest } = useLogoutYoutube()
  return executeRequest({ urlParams: { distributionServiceName } })
}
