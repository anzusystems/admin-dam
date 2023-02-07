<script lang="ts" setup>
import { useTheme } from '@/composables/system/themeSettings'

const { theme } = useTheme()
</script>

<template>
  <Notifications :max="5" group="alerts" position="top center" width="50%">
    <template #body="props">
      <VAlert :type="props.item.type" class="ma-1" density="compact">
        <div v-html="props.item.text" />
        <template #close>
          <VIcon icon="mdi-close" @click.stop="props.close" />
        </template>
      </VAlert>
    </template>
  </Notifications>
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
