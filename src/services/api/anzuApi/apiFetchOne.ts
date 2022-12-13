import { useErrorHandler } from '@/composables/system/error'
import { AnzuApiResponseCodeError } from '@/model/common/error/AnzuApiResponseCodeError'
import { AnzuApiValidationError } from '@/model/common/error/AnzuApiValidationError'
import { replaceUrlParameters, type UrlParams } from '@/services/api/apiHelper'
import { isValidHTTPStatus } from '@/services/api/statusCodes'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

const { isValidationError, handleValidationError } = useErrorHandler()

/**
 * @template R Response type
 */
export const apiFetchOne = <R>(
  client: () => AxiosInstance,
  urlTemplate: string,
  urlParams: UrlParams = {},
  system: string,
  entity: string,
  options: AxiosRequestConfig = {}
): Promise<R> => {
  return new Promise((resolve, reject) => {
    client()
      .get(replaceUrlParameters(urlTemplate, urlParams), options)
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
