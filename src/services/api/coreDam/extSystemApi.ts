import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamExtSystem, IntegerId } from '@anzusystems/common-admin'
import { apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { ExtSystem, ExtSystemTtsSettings } from '@/types/coreDam/ExtSystem'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const updateExtSystem = (id: number, data: DamExtSystem) =>
  apiUpdateOne<DamExtSystem>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystem = (id: number) =>
  apiFetchOne<ExtSystem>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const updateExtSystemTtsSettings = (extSystemId: IntegerId, data: ExtSystemTtsSettings) =>
  apiUpdateOne<ExtSystemTtsSettings, ExtSystem>(
    damClient,
    data,
    END_POINT + '/:extSystemId/tts-settings',
    { extSystemId },
    SYSTEM_CORE_DAM,
    ENTITY
  )
