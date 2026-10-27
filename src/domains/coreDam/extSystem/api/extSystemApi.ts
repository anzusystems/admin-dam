import type { DamExtSystem } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { ExtSystem } from '@/domains/coreDam/extSystem/types/ExtSystem'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const useFetchExtSystemList = () =>
  useApiFetchList<DamExtSystem>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT })

export const useFetchExtSystemListByIds = () =>
  useApiFetchByIds<DamExtSystem>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT })

export const useFetchExtSystem = () =>
  useApiRequest<ExtSystem, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useUpdateExtSystem = () =>
  useApiRequest<ExtSystem, ExtSystem>({ ...damApiBase, method: 'PUT', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
