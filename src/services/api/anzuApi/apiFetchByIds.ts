import { useErrorHandler } from '@anzusystems/common-admin'
import { AnzuApiResponseCodeError } from '@/model/common/error/AnzuApiResponseCodeError'
import { AnzuApiValidationError } from '@/model/common/error/AnzuApiValidationError'
import { replaceUrlParameters, type UrlParams } from '@/services/api/apiHelper'
import { useQueryBuilder } from '@/services/api/queryBuilder'
import { isValidHTTPStatus } from '@/services/api/statusCodes'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

const { isValidationError, handleValidationError } = useErrorHandler()

/**
 * @template T Type used for request payload, by default same as Response type
 * @template R Response type override, optional
 */
const generateByIdsApiQuery = (ids: number[] | string[], isSearchApi: boolean): string => {
  const { querySetLimit, querySetOffset, querySetOrder, queryBuild, queryAddFilter, queryAdd } = useQueryBuilder()
  const limit = ids.length
  querySetLimit(limit)
  querySetOffset(1, limit)
  querySetOrder('id', false)
  if (isSearchApi) queryAdd('id', ids.join(','))
  else queryAddFilter('in', 'id', ids.join(','))

  return queryBuild()
}

export const apiFetchByIds = <T, R = T>(
  client: () => AxiosInstance,
  ids: string[] | number[],
  urlTemplate: string,
  urlParams: UrlParams = {},
  system: string,
  entity: string,
  options: AxiosRequestConfig = {},
  isSearchApi = false
): Promise<R> => {
  return new Promise((resolve, reject) => {
    client()
      .get(replaceUrlParameters(urlTemplate, urlParams) + generateByIdsApiQuery(ids, isSearchApi), options)
      .then((res) => {
        if (!isValidHTTPStatus(res.status)) {
          throw new AnzuApiResponseCodeError()
        }
        resolve(res.data.data)
      })
      .catch((err) => {
        if (isValidationError(err)) {
          handleValidationError(err, system, entity)
          reject(new AnzuApiValidationError())
        }
        reject(err)
      })
  })
}
