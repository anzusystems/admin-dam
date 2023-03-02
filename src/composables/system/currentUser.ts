import { fetchCurrentUser } from '@/services/api/coreDam/userApi'
import { envConfig } from '@/services/EnvConfigService'
import { readonly, ref } from 'vue'
import type { CurrentUserDto } from '@/types/coreDam/CurrentUser'
import { ROLE_SUPER_ADMIN } from '@anzusystems/common-admin'

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
        if (res.roles.includes(ROLE_SUPER_ADMIN)) currentUserIsSuperAdmin.value = true
        if (currentUserIsSuperAdmin.value || envConfig.appVersion === 'dev') showDevFeature.value = true

        resolve(currentUser)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export function useCurrentUser() {
  return {
    currentUser: readonly(currentUser),
    currentUserIsSuperAdmin: readonly(currentUserIsSuperAdmin),
    showDevFeature,
  }
}
