import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import type { Ref } from 'vue'

import { useLogin } from '@/domains/system/auth/authApi'
import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'
import { useSimpleLoginFactory } from '@/domains/system/auth/SimpleLoginFactory'

const loginButtonLoading = ref(false)

export const useSimpleLoginActions = () => {
  const { createDefault } = useSimpleLoginFactory()
  const simpleLoginForm: Ref<SimpleLoginForm> = ref(createDefault())
  const { showErrorT } = useAlerts()

  const { execute: login } = useLogin()

  const onLogin = async () => {
    // The button binds to this flag: it gives feedback and blocks a second submit.
    if (loginButtonLoading.value) return
    loginButtonLoading.value = true
    try {
      await login({ body: simpleLoginForm.value })
      /*
       * A full load, not a router push: user, ACL, configuration and
       * login status live in module state that survives navigation.
       * Replace so Back does not show the sign-in page to a signed-in user.
       */
      window.location.replace('/')

      // Left loading on purpose: the page is unloading, and resetting would make the button clickable again.
      return
    } catch (error) {
      // todo check for possible errors and display correct one
      showErrorT('auth.simpleLogin.alerts.failure')
    }
    loginButtonLoading.value = false
  }

  return {
    loginButtonLoading,
    simpleLoginForm,
    onLogin,
  }
}
