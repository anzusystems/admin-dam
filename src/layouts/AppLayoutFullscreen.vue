<script lang="ts" setup>
import { AAlerts, useTheme } from '@anzusystems/common-admin'
import ASystemBar from '@/components/system/ASystemBar.vue'

const { theme } = useTheme()
</script>

<template>
  <AAlerts />
  <VApp :theme="theme">
    <ASystemBar />
    <VMain>
      <slot />
    </VMain>
  </VApp>
</template>
