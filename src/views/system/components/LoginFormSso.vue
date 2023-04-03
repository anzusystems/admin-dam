<script lang="ts" setup>
import { envConfig } from '@/services/EnvConfigService'
import { AUTH_LOGIN_PATH } from '@/services/api/coreDam/authApi'

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
