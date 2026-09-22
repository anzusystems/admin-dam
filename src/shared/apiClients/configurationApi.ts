import { damClient } from '@/shared/apiClients/damClient'
import type { DamExtSystemConfig, DamPrvConfig, DamPubConfig } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/configuration'
export const PUB_END_POINT_PREFIX = '/pub'
const PUB_END_POINT = PUB_END_POINT_PREFIX + '/v1/configuration'
export const ENTITY = 'settings'

export const useFetchPubConfiguration = () =>
  useApiRequest<DamPubConfig, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: PUB_END_POINT,
  })

export const useFetchConfiguration = () =>
  useApiRequest<DamPrvConfig, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchExtSystemConfiguration = (extSystem: IntegerId) =>
  useApiRequest<DamExtSystemConfig, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/ext-system/' + extSystem,
  })
