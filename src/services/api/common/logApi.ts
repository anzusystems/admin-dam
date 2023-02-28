import { SYSTEM_ADMIN_DAM, SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchList, apiFetchOne } from '@anzusystems/common-admin'
import type { Log } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import { damClient } from '@/services/api/clients/damClient'

const END_POINT = '/adm/v1/log'
export const ENTITY = 'log'

const setupBySystem = (system: string) => {
  let client: () => AxiosInstance
  let endpoint = ''
  switch (system) {
    case SYSTEM_CORE_DAM:
    case SYSTEM_ADMIN_DAM:
    default:
      client = damClient
      endpoint = END_POINT
  }

  return { client, endpoint }
}

export const fetchLogList = (system: string, pagination: Pagination, filterBag: FilterBag) => {
  const { client, endpoint } = setupBySystem(system)

  return apiFetchList<Log[]>(
    client,
    endpoint + '/:type',
    { type: filterBag.type.model },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )
}

export const fetchLog = (id: string, system: string, type: string) => {
  const { client, endpoint } = setupBySystem(system)

  return apiFetchOne<Log>(client, endpoint + '/:type/:id', { id, type }, SYSTEM_CORE_DAM, ENTITY)
}
