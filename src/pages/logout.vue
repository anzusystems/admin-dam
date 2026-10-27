<script setup lang="ts">
import { ALogoutView } from '@anzusystems/common-admin'

import { envConfig } from '@/shared/EnvConfigService'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})

const logoutUrl = () => envConfig.logoutCoreDamUrl
</script>

<template>
  <ALogoutView :logout-url="logoutUrl" />
</template>
