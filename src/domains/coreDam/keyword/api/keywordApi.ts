import type { DamKeyword } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/keyword'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'keyword'

export const useFetchKeywordList = () =>
  useApiFetchList<DamKeyword>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useFetchKeywordListByIds = () =>
  useApiFetchByIds<DamKeyword>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST + '/search',
    isSearchApi: true,
  })

export const useCreateKeyword = () =>
  useApiRequest<DamKeyword, DamKeyword>({ ...damApiBase, method: 'POST', entity: ENTITY, urlTemplate: END_POINT })

export const useUpdateKeyword = () =>
  useApiRequest<DamKeyword, DamKeyword>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchKeyword = () =>
  useApiRequest<DamKeyword, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const fetchKeywordListByIds = (extSystemId: number, ids: string[]) => {
  const { execute } = useFetchKeywordListByIds()
  return execute(ids, { urlParams: { extSystemId } })
}

export const createKeyword = (data: DamKeyword) => {
  const { execute } = useCreateKeyword()
  return execute({ body: data })
}
