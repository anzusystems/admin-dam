<script lang="ts" setup>
import { useTheme } from '@/composables/system/themeSettings'
import ASystemBar from '@/components/system/ASystemBar.vue'
import { AAlerts } from '@anzusystems/common-admin'

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
