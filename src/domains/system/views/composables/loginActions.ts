import { useSimpleLoginFactory } from '@/domains/system/auth/SimpleLoginFactory'
import { useLogin } from '@/domains/system/auth/authApi'
import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'

const loginButtonLoading = ref(false)

export const useSimpleLoginActions = () => {
  const { createDefault } = useSimpleLoginFactory()
  const simpleLoginForm: Ref<SimpleLoginForm> = ref(createDefault())
  const { showErrorT } = useAlerts()

  const { executeRequest: login } = useLogin()

  const onLogin = async () => {
    // The button binds to it: without this there is no feedback and nothing stops a second submit.
    if (loginButtonLoading.value) return
    loginButtonLoading.value = true
    try {
      await login({ object: simpleLoginForm.value })
      /* A full load, not a router push: the current user, the ACL, the configuration and the login
       * status live in module state a navigation carries over. */
      window.location.href = '/'

      // And left loading: the document is on its way out, and the button would be clickable again.
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
