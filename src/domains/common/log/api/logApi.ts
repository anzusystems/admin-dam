import { SYSTEM_ADMIN_DAM, SYSTEM_CORE_DAM } from '@/shared/systems'
import type { Log } from '@anzusystems/common-admin'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { AxiosInstance } from 'axios'
import { damClient } from '@/shared/apiClients/damClient'

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

export const useFetchLogList = (system: string) => {
  const { client, endpoint } = setupBySystem(system)

  return useApiFetchList<Log[]>({
    client,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: endpoint + '/:type',
  })
}

export const useFetchLog = (system: string) => {
  const { client, endpoint } = setupBySystem(system)

  return useApiRequest<Log, null>({
    client,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: endpoint + '/:type/:id',
  })
}
