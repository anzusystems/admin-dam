import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiAnyRequest } from '@/services/api/anzuApi'
import type { SimpleLoginForm } from '@/types/dam/Auth'

export const AUTH_PATH_PREFIX = '/auth'

export const login = (data: SimpleLoginForm) =>
  apiAnyRequest<SimpleLoginForm, any>(damClient, 'POST', AUTH_PATH_PREFIX + '/login', {}, data, SYSTEM_CORE_DAM, '')

export const refreshToken = () =>
  apiAnyRequest<object, any>(damClient, 'POST', AUTH_PATH_PREFIX + '/refresh-token', {}, {}, SYSTEM_CORE_DAM, '')
