<script lang="ts" setup>
import { envConfig } from '@/shared/EnvConfigService'
import { AUTH_LOGIN_PATH } from '@/domains/system/auth/authApi'

const url = envConfig.dam.apiUrl + AUTH_LOGIN_PATH
</script>

<template>
  <div class="py-5">
    <VBtn
      :href="url"
      color="primary"
      size="large"
    >
      Log in
    </VBtn>
  </div>
</template>
