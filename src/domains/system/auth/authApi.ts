import { useApiRequest } from '@anzusystems/common-admin'

import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authPath'
import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export { AUTH_PATH_PREFIX }
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
