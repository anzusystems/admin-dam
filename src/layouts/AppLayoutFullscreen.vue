<script lang="ts" setup>
import { AAlerts, ASystemBar, useTheme } from '@anzusystems/common-admin'
import { envConfig } from '@/services/EnvConfigService'

const { theme } = useTheme()
</script>

<template>
  <AAlerts />
  <VApp :theme="theme">
    <ASystemBar :current-version="envConfig.appVersion" />
    <VMain>
      <slot />
    </VMain>
  </VApp>
</template>
