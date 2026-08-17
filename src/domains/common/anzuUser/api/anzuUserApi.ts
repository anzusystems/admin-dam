import type { AnzuUser } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'

const SYSTEM = 'common'
export const ENTITY = 'anzuUser'

const END_POINT = '/adm/v1/anzu-user'

export const useFetchAnzuUserListByIds = () =>
  useApiFetchByIds<AnzuUser[]>({
    client: damClient,
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchAnzuUserList = () =>
  useApiFetchList<AnzuUser[]>({
    client: damClient,
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchAnzuUser = () =>
  useApiRequest<AnzuUser, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useCreateAnzuUser = () =>
  useApiRequest<AnzuUser, AnzuUser>({
    client: damClient,
    method: 'POST',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAnzuUser = () =>
  useApiRequest<AnzuUser, AnzuUser>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
