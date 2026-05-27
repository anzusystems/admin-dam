<script setup lang="ts">
import { ALogoutView } from '@anzusystems/common-admin'
import { envConfig } from '@/services/EnvConfigService'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})
</script>

<template>
  <ALogoutView :logout-url="() => envConfig.logoutCoreDamUrl" />
</template>
