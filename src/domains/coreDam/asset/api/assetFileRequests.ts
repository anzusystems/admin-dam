import { useApiCommand, useApiRequest } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

/*
 * Asset file requests (slot, route, main file, image, link) go through the library api helpers.
 * Server refusals (403, a 422 with reasons) then arrive as errors
 * the alerts can show. Raw axios errors showed "Systémová chyba".
 * Only the statuses the endpoint documents count as success.
 */

type FileMethod = 'GET' | 'PATCH' | 'PUT' | 'DELETE'

const paramsOf = (method: FileMethod, url: string, statuses: number[], validationEntity?: string) => ({
  client: damClient,
  method,
  system: SYSTEM_CORE_DAM,
  entity: ENTITY,
  // Fields named in a 422 are labelled as the sending form labels them.
  ...(validationEntity ? { validationEntity } : {}),
  urlTemplate: url,
  options: { validateStatus: (status: number) => statuses.includes(status) },
})

/**
 * For a change whose response is not read.
 */
export const fileCommand = (method: FileMethod, url: string, statuses: number[], body?: object) =>
  useApiCommand<object>(paramsOf(method, url, statuses)).execute(body ? { body } : {})

/**
 * For a request with a response body.
 * `validationEntity` is the `coreDam.<entity>.model` under which field names are looked up.
 */
export const fileRequest = <R extends NonNullable<unknown>>(
  method: FileMethod,
  url: string,
  statuses: number[],
  body?: object,
  validationEntity?: string
) => useApiRequest<R, object>(paramsOf(method, url, statuses, validationEntity)).execute(body ? { body } : {})

/**
 * Validation entity for file route field labels (the slug).
 */
export const ROUTE_VALIDATION_ENTITY = 'asset.assetFilePublicLink'
