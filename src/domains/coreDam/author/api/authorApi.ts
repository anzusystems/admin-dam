import type { DamAuthor } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/author'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'author'

export const useFetchAuthorListByIds = () =>
  useApiFetchByIds<DamAuthor>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST + '/search',
    isSearchApi: true,
  })

export const useFetchAuthorList = () =>
  useApiFetchList<DamAuthor>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useUpdateAuthor = () =>
  useApiRequest<DamAuthor, DamAuthor>({ ...damApiBase, method: 'PUT', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useFetchAuthor = () =>
  useApiRequest<DamAuthor, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
