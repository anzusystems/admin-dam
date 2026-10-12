<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type {
  ToolbarItemButton,
  ToolbarItemSeparator,
} from '@/domains/coreDam/shared/components/anzutap/components/anzutapToolbar'

withDefaults(
  defineProps<{
    item: ToolbarItemButton | ToolbarItemSeparator
  }>(),
  {}
)

const { t } = useI18n()
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
        :text="t(item.titleT)"
      />
    </VBtn>
  </template>
</template>
