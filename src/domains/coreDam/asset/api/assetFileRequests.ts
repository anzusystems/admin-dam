import { useApiCommand, useApiRequest } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

/* A request about a file of an asset - its slot, its route, the main file, its picture, its link - through the api
 * helpers of the library: what the server refuses (403, a 422 that says why) comes as an error the alerts can tell,
 * where the raw error of axios they were handed showed "Systémová chyba". Settled by the statuses the endpoint answers
 * with, as the hand-made promises before were: any other is refused too. */

type FileMethod = 'GET' | 'PATCH' | 'PUT' | 'DELETE'

const paramsOf = (method: FileMethod, url: string, statuses: number[], validationEntity?: string) => ({
  client: damClient,
  method,
  system: SYSTEM_CORE_DAM,
  entity: ENTITY,
  // A field the server names in a 422 is labelled as the form that sent it labels it.
  ...(validationEntity ? { validationEntity } : {}),
  urlTemplate: url,
  options: { validateStatus: (status: number) => statuses.includes(status) },
})

/** A change whose answer nobody reads. */
export const fileCommand = (method: FileMethod, url: string, statuses: number[], body?: object) =>
  useApiCommand<object>(paramsOf(method, url, statuses)).execute(body ? { body } : {})

/** A request answered with a body. `validationEntity`: under which `coreDam.<entity>.model` the fields are named. */
export const fileRequest = <R extends NonNullable<unknown>>(
  method: FileMethod,
  url: string,
  statuses: number[],
  body?: object,
  validationEntity?: string
) => useApiRequest<R, object>(paramsOf(method, url, statuses, validationEntity)).execute(body ? { body } : {})

/** The labels of the fields of the route of a file: its slug. */
export const ROUTE_VALIDATION_ENTITY = 'asset.assetFilePublicLink'
