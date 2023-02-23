<script lang="ts" setup>
import { useTheme } from '@anzusystems/common-admin'
import { AAlerts } from '@anzusystems/common-admin'

const { theme } = useTheme()
</script>

<template>
  <AAlerts />
  <VApp :theme="theme">
    <slot />
  </VApp>
</template>

<style lang="scss">
body,
html {
  overflow: auto !important;
  color: #111;
}

.custom-filter-button {
  opacity: 0.9;
  position: relative;

  &.v-btn--variant-outlined {
    border-style: dashed;
  }

  &__text {
    position: absolute;
    left: 36px;
  }
}
</style>
