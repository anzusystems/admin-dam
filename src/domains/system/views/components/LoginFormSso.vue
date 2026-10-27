<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { AUTH_LOGIN_PATH } from '@/domains/system/auth/authApi'
import { envConfig } from '@/shared/EnvConfigService'

const url = envConfig.dam.apiUrl + AUTH_LOGIN_PATH

const { t } = useI18n()

/*
 * The sign-in service replaces the sign-in page in browser history, so Back after sign-in does not show it.
 * A click with a modifier key or a non-primary button is left to the link (new tab or window).
 */
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
