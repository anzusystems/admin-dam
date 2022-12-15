import { damClient } from '@/services/api/clients/damClient'
import { apiFetchOne } from '@/services/api/anzuApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamConfig, DamConfigExtSystem, DamPubConfig } from '@/types/dam/DamConfig'
import type { IntegerId } from '@/types/common'

const END_POINT = '/adm/v1/configuration'
export const PUB_END_POINT_PREFIX = '/pub'
const PUB_END_POINT = PUB_END_POINT_PREFIX + '/v1/configuration'
export const ENTITY = 'settings'

export const fetchPubConfiguration = () =>
  apiFetchOne<DamPubConfig>(damClient, PUB_END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)
export const fetchConfiguration = () => apiFetchOne<DamConfig>(damClient, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystemConfiguration = (extSystem: IntegerId) =>
  apiFetchOne<DamConfigExtSystem>(damClient, END_POINT + '/ext-system/' + extSystem, {}, SYSTEM_CORE_DAM, ENTITY)
