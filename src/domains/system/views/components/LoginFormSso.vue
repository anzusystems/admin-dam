<script lang="ts" setup>
import { envConfig } from '@/shared/EnvConfigService'
import { AUTH_LOGIN_PATH } from '@/domains/system/auth/authApi'
import { useI18n } from 'vue-i18n'

const url = envConfig.dam.apiUrl + AUTH_LOGIN_PATH

const { t } = useI18n()
</script>

<template>
  <div class="py-5">
    <VBtn
      :href="url"
      color="primary"
      size="large"
    >
      {{ t('common.system.login.button') }}
    </VBtn>
  </div>
</template>
