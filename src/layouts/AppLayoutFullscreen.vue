<script lang="ts" setup>
import { useTheme } from '@anzusystems/common-admin'
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
