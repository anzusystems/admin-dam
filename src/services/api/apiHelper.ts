import type { AxiosResponse } from 'axios'
import { ref, shallowRef } from 'vue'
import { urlTemplateReplace } from '@/utils/string'
import { isEmpty } from '@/utils/object'

export type UrlParams = {
  [key: string]: number | string
}

export const replaceUrlParameters = (urlTemplate: string, urlParams: UrlParams, overrideUrlTemplate = '') => {
  if (isEmpty(urlParams)) return urlTemplate
  return urlTemplateReplace(overrideUrlTemplate === '' ? urlTemplate : overrideUrlTemplate, urlParams)
}

export function useApiLoaderHelper() {
  const isFinished = ref(false)
  const isLoading = ref(false)

  const loading = (loading: boolean) => {
    isLoading.value = loading
    isFinished.value = !loading
  }

  return {
    isLoading,
    isFinished,
    loading,
  }
}

export function useApiDataHelper<T, D>(defaultData: D) {
  const response = shallowRef<AxiosResponse>()
  const data = ref<T | D>(defaultData)
  const error = shallowRef<any>()

  return {
    response,
    data,
    error,
  }
}
