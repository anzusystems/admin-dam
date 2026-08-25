import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { DamExtSystem } from '@anzusystems/common-admin'
import type { ExtSystem } from '@/domains/coreDam/extSystem/types/ExtSystem'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const useFetchExtSystemList = () =>
  useApiFetchList<DamExtSystem[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchExtSystemListByIds = () =>
  useApiFetchByIds<DamExtSystem[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchExtSystem = () =>
  useApiRequest<ExtSystem, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useUpdateExtSystem = () =>
  useApiRequest<ExtSystem, ExtSystem>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
