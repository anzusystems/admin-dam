import { damClient } from '@/services/api/clients/damClient'
import type { IntegerId } from '@anzusystems/common-admin'
import { apiFetchOne } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamPrvConfig, DamExtSystemConfig, DamPubConfig } from '@/types/coreDam/DamConfig'

const END_POINT = '/adm/v1/configuration'
export const PUB_END_POINT_PREFIX = '/pub'
const PUB_END_POINT = PUB_END_POINT_PREFIX + '/v1/configuration'
export const ENTITY = 'settings'

export const fetchPubConfiguration = () =>
  apiFetchOne<DamPubConfig>(damClient, PUB_END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchConfiguration = () => apiFetchOne<DamPrvConfig>(damClient, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystemConfiguration = (extSystem: IntegerId) =>
  apiFetchOne<DamExtSystemConfig>(damClient, END_POINT + '/ext-system/' + extSystem, {}, SYSTEM_CORE_DAM, ENTITY)
