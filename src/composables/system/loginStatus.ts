import { readonly, ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { isNull, isUndefined } from '@/utils/common'

const LOGOUT_STATUS = 0
const LOGGED_STATUS = 1
const CSRF_FAILED_STATUS = 2
const UNAUTHORIZED_STATUS = 3
const SSO_COMMUNICATION_FAILED_STATUS = 4

const status = ref<number | null>(null)

export function useLoginStatus(to: RouteLocationNormalized) {
  if (isUndefined(to.query.logged)) {
    status.value = parseInt(to.query.logged + '', 10)
  }

  const isStatusNotDefined = () => isNull(status.value)
  const isStatusLogout = () => status.value === LOGOUT_STATUS
  const isStatusLogged = () => status.value === LOGGED_STATUS
  const isStatusCsrfFailed = () => status.value === CSRF_FAILED_STATUS
  const isStatusUnauthorized = () => status.value === UNAUTHORIZED_STATUS
  const isStatusSsoCommunicationFailed = () => status.value === SSO_COMMUNICATION_FAILED_STATUS

  return {
    status: readonly(status),
    isStatusNotDefined,
    isStatusLogout,
    isStatusLogged,
    isStatusCsrfFailed,
    isStatusUnauthorized,
    isStatusSsoCommunicationFailed,
  }
}
