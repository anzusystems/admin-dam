import { fetchCurrentUser } from '@/services/api/dam/userApi'
import { envConfig } from '@/services/EnvConfigService'
import { isNotUndefined } from '@/utils/common'
import { readonly, ref } from 'vue'
import { UserRole } from '@/model/dam/valueObject/UserRole'
import type { User } from '@/types/dam/User'

const currentUser = ref<User | undefined>(undefined)
const currentUserIsSuperAdmin = ref(false)
const showDevFeature = ref(false)

export function logoutUser() {
  window.location.pathname = '/logout'
}

export function updateCurrentUser() {
  return new Promise((resolve, reject) => {
    fetchCurrentUser()
      .then((res: User) => {
        currentUser.value = res
        if (res.roles.includes(UserRole.Admin)) currentUserIsSuperAdmin.value = true
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
