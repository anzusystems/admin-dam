import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiAnyRequest } from '@anzusystems/common-admin'
import type { SimpleLoginForm } from '@/types/coreDam/Auth'

export const AUTH_PATH_PREFIX = '/auth'
export const AUTH_LOGIN_PATH = AUTH_PATH_PREFIX + '/login'

export const login = (data: SimpleLoginForm) =>
  apiAnyRequest<SimpleLoginForm, any>(damClient, 'POST', AUTH_LOGIN_PATH, {}, data, SYSTEM_CORE_DAM, '')

export const refreshToken = () =>
  apiAnyRequest<object, any>(damClient, 'POST', AUTH_PATH_PREFIX + '/refresh-token', {}, {}, SYSTEM_CORE_DAM, '')
