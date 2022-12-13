<script lang="ts" setup>
import { useTheme } from '@/composables/system/themeSettings'

const { theme } = useTheme()
</script>

<template>
  <VApp :theme="theme">
    <VMain class="d-flex w-100 h-100 align-center justify-center">
      <VProgressCircular indeterminate color="primary"></VProgressCircular>
    </VMain>
  </VApp>
</template>
