import type { AnzuUser, FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'

const SYSTEM = 'common'
export const ENTITY = 'anzuUser'

export const useAnzuUserApi = (client: () => AxiosInstance, endPoint = '/adm/v1/anzu-user') => {
  const apiFetchAnzuUserListByIds = (ids: IntegerId[]) =>
    apiFetchByIds<AnzuUser[]>(client, ids, endPoint, {}, SYSTEM, ENTITY)

  const apiFetchAnzuUserList = (pagination: Pagination, filterBag: FilterBag) =>
    apiFetchList<AnzuUser[]>(client, endPoint, {}, pagination, filterBag, SYSTEM, ENTITY)

  const apiFetchAnzuUser = (id: IntegerId) => apiFetchOne<AnzuUser>(client, endPoint + '/:id', { id }, SYSTEM, ENTITY)

  const apiCreateAnzuUser = (data: AnzuUser) => apiCreateOne<AnzuUser>(client, data, endPoint, {}, SYSTEM, ENTITY)

  const apiUpdateAnzuUser = (id: IntegerId, data: AnzuUser) =>
    apiUpdateOne<AnzuUser>(client, data, endPoint + '/:id', { id }, SYSTEM, ENTITY)

  return {
    apiFetchAnzuUserListByIds,
    apiFetchAnzuUserList,
    apiFetchAnzuUser,
    apiCreateAnzuUser,
    apiUpdateAnzuUser,
  }
}
