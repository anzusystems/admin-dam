import { useSimpleLoginFactory } from '@/model/coreDam/factory/SimpleLoginFactory'
import { login } from '@/services/api/coreDam/authApi'
import type { SimpleLoginForm } from '@/types/coreDam/Auth'

const loginButtonLoading = ref(false)

export const useSimpleLoginActions = () => {
  const { createDefault } = useSimpleLoginFactory()
  const simpleLoginForm: Ref<SimpleLoginForm> = ref(createDefault())
  const { showErrorT } = useAlerts()
  const router = useRouter()

  const onLogin = async () => {
    try {
      await login(simpleLoginForm.value)
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
