import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'

export const AUTH_PATH_PREFIX = '/auth'
export const AUTH_LOGIN_PATH = AUTH_PATH_PREFIX + '/login'

export const useLogin = () =>
  useApiRequest<SimpleLoginForm, SimpleLoginForm>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: '',
    urlTemplate: AUTH_LOGIN_PATH,
  })

export const useRefreshToken = () =>
  useApiRequest<object, object>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: '',
    urlTemplate: AUTH_PATH_PREFIX + '/refresh-token',
  })
