<script lang="ts" setup>
import { ASystemBar, useTheme } from '@anzusystems/common-admin'

import { envConfig } from '@/shared/EnvConfigService'

const { theme } = useTheme()
</script>

<template>
  <VApp :theme="theme">
    <ASystemBar :current-version="envConfig.appVersion" />
    <VMain>
      <slot />
    </VMain>
  </VApp>
</template>
