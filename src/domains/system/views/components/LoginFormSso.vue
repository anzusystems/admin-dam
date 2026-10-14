<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { AUTH_LOGIN_PATH } from '@/domains/system/auth/authApi'
import { envConfig } from '@/shared/EnvConfigService'

const url = envConfig.dam.apiUrl + AUTH_LOGIN_PATH

const { t } = useI18n()

/* The sign-in service takes the place of the sign-in page in the history of the browser: Back from the application,
 * once signed in, does not show that page. A press with a key held, or by another button, is left to the link: a new
 * tab or window, as a link opens it. */
const onPress = (event: MouseEvent) => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  window.location.replace(url)
}
</script>

<template>
  <div class="py-5">
    <VBtn
      :href="url"
      color="primary"
      size="large"
      @click="onPress"
    >
      {{ t('common.system.login.button') }}
    </VBtn>
  </div>
</template>
