import { useSimpleLoginFactory } from '@/model/dam/factory/SimpleLoginFactory'
import { ref } from 'vue'
import type { Ref } from 'vue/dist/vue'
import { login } from '@/services/api/dam/authApi'
import { useAlerts } from '@/composables/system/alerts'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useUiHelper } from '@/composables/system/uiHelper'
import type { SimpleLoginForm } from '@/types/dam/Auth'

const { btnLoadingOn, btnLoadingOff } = useUiHelper()

export const useSimpleLoginActions = () => {
  const { createDefault } = useSimpleLoginFactory()
  const simpleLoginForm: Ref<SimpleLoginForm> = ref(createDefault())
  const { showErrorT } = useAlerts()
  const router = useRouter()

  const onLogin = async () => {
    try {
      btnLoadingOn('login')
      await login(simpleLoginForm.value)
      router.push({ name: ROUTE.DEFAULT })
    } catch (error) {
      // todo check for possible errors and display correct one
      showErrorT('auth.simpleLogin.alerts.failure')
      btnLoadingOff('login')
    }
  }

  return {
    simpleLoginForm,
    onLogin,
  }
}
