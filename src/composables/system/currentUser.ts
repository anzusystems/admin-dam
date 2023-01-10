import { fetchCurrentUser } from '@/services/api/dam/userApi'
import { envConfig } from '@/services/EnvConfigService'
import { isNotUndefined } from '@/utils/common'
import { readonly, ref } from 'vue'
import type { CurrentUserDto } from '@/types/dam/CurrentUser'

const currentUser = ref<CurrentUserDto | undefined>(undefined)
const currentUserIsSuperAdmin = ref(false)
const showDevFeature = ref(false)

export function logoutUser() {
  window.location.pathname = '/logout'
}

export function updateCurrentUser() {
  return new Promise((resolve, reject) => {
    fetchCurrentUser()
      .then((res: CurrentUserDto) => {
        currentUser.value = res
        if (res.superAdmin) currentUserIsSuperAdmin.value = true
        if (currentUserIsSuperAdmin.value || envConfig.appVersion === 'dev') showDevFeature.value = true

        resolve(currentUser)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export function useCurrentUser() {
  const hasCurrentUser = () => isNotUndefined(currentUser.value)

  return {
    currentUser: readonly(currentUser),
    currentUserIsSuperAdmin: readonly(currentUserIsSuperAdmin),
    hasCurrentUser,
    showDevFeature,
  }
}
