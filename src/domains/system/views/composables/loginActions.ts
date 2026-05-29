import { useSimpleLoginFactory } from '@/domains/system/auth/SimpleLoginFactory'
import { useLogin } from '@/domains/system/auth/authApi'
import type { SimpleLoginForm } from '@/domains/system/auth/simpleLogin'

const loginButtonLoading = ref(false)

export const useSimpleLoginActions = () => {
  const { createDefault } = useSimpleLoginFactory()
  const simpleLoginForm: Ref<SimpleLoginForm> = ref(createDefault())
  const { showErrorT } = useAlerts()
  const router = useRouter()

  const { executeRequest: login } = useLogin()

  const onLogin = async () => {
    try {
      await login({ object: simpleLoginForm.value })
      router.push({ name: '/(coreDam)/assets' })
    } catch (error) {
      // todo check for possible errors and display correct one
      showErrorT('auth.simpleLogin.alerts.failure')
    } finally {
      loginButtonLoading.value = false
    }
  }

  return {
    loginButtonLoading,
    simpleLoginForm,
    onLogin,
  }
}
