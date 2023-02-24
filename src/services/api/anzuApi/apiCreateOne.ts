import { useErrorHandler } from '@anzusystems/common-admin'
import { AnzuApiResponseCodeError } from '@/model/common/error/AnzuApiResponseCodeError'
import { AnzuApiValidationError } from '@/model/common/error/AnzuApiValidationError'
import { replaceUrlParameters, type UrlParams } from '@/services/api/apiHelper'
import { isValidHTTPStatus } from '@/services/api/statusCodes'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

const { isValidationError, handleValidationError } = useErrorHandler()

/**
 * @template T Type used for request payload, by default same as Response type
 * @template R Response type override, optional
 */
export const apiCreateOne = <T, R = T>(
  client: () => AxiosInstance,
  object: T | Record<string, never> = {},
  urlTemplate: string,
  urlParams: UrlParams = {},
  system: string,
  entity: string,
  options: AxiosRequestConfig = {}
): Promise<R> => {
  return new Promise((resolve, reject) => {
    client()
      .post(replaceUrlParameters(urlTemplate, urlParams), JSON.stringify(object), options)
      .then((res) => {
        if (!isValidHTTPStatus(res.status)) {
          throw new AnzuApiResponseCodeError()
        }
        resolve(res.data)
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
