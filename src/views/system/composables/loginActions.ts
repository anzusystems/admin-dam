import { useSimpleLoginFactory } from '@/model/dam/factory/SimpleLoginFactory'
import { ref } from 'vue'
import type { Ref } from 'vue/dist/vue'
import { login } from '@/services/api/dam/authApi'
import { useAlerts } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { SimpleLoginForm } from '@/types/dam/Auth'

const loginButtonLoading = ref(false)

export const useSimpleLoginActions = () => {
  const { createDefault } = useSimpleLoginFactory()
  const simpleLoginForm: Ref<SimpleLoginForm> = ref(createDefault())
  const { showErrorT } = useAlerts()
  const router = useRouter()

  const onLogin = async () => {
    try {
      await login(simpleLoginForm.value)
      router.push({ name: ROUTE.DEFAULT })
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
