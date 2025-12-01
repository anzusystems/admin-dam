<script setup lang="ts">
import type { ToolbarItemButton, ToolbarItemSeparator } from './anzutapToolbar'

withDefaults(
  defineProps<{
    item: ToolbarItemButton | ToolbarItemSeparator
  }>(),
  {}
)
</script>

<template>
  <template v-if="item.type === 'separator'">
    <VDivider
      class="anzutap-toolbar__separator"
      vertical
    />
  </template>
  <template v-else-if="item.type === 'button'">
    <VBtn
      :class="[
        'anzutap-toolbar__item',
        'anzutap-toolbar__item--button',
        { 'anzutap-toolbar__item--active': item.active() },
      ]"
      size="small"
      variant="text"
      @click="item.command"
    >
      <VIcon :icon="item.icon" />
      <VTooltip
        anchor="bottom"
        activator="parent"
        :text="item.titleT"
      />
    </VBtn>
  </template>
</template>

<style lang="scss" scoped>
.anzutap-toolbar {
  &__separator {
    margin: 0 4px;
  }

  &__item {
    &--active {
      background-color: rgba(var(--v-theme-primary), 0.1);
    }
  }
}
</style>
