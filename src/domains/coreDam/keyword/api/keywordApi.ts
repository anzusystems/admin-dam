import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { DamKeyword } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'

const END_POINT = '/adm/v1/keyword'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'keyword'

export const useFetchKeywordList = () =>
  useApiFetchList<DamKeyword[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useFetchKeywordListByIds = () =>
  useApiFetchByIds<DamKeyword[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST + '/search',
    isSearchApi: true,
  })

export const useCreateKeyword = () =>
  useApiRequest<DamKeyword, DamKeyword>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateKeyword = () =>
  useApiRequest<DamKeyword, DamKeyword>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchKeyword = () =>
  useApiRequest<DamKeyword, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchKeywordListByIds = (extSystemId: number, ids: string[]) => {
  const { executeFetch } = useFetchKeywordListByIds()
  return executeFetch(ids, { urlParams: { extSystemId } })
}

export const createKeyword = (data: DamKeyword) => {
  const { executeRequest } = useCreateKeyword()
  return executeRequest({ object: data })
}
