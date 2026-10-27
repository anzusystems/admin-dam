import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

/** `client` and `system` of every damClient request: `useApiRequest({ ...damApiBase, method, entity, urlTemplate })` */
export const damApiBase = { client: damClient, system: SYSTEM_CORE_DAM } as const
