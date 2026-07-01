import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { DamAuthor } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'

const END_POINT = '/adm/v1/author'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'author'

export const useFetchAuthorListByIds = () =>
  useApiFetchByIds<DamAuthor[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST + '/search',
    isSearchApi: true,
  })

export const useFetchAuthorList = () =>
  useApiFetchList<DamAuthor[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useCreateAuthor = () =>
  useApiRequest<DamAuthor, DamAuthor>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAuthor = () =>
  useApiRequest<DamAuthor, DamAuthor>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAuthor = () =>
  useApiRequest<DamAuthor, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
