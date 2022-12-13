<script lang="ts" setup>
import { useTheme } from '@/composables/system/themeSettings'
import ASystemBar from '@/components/system/ASystemBar.vue'

const { theme } = useTheme()
</script>

<template>
  <notifications :max="5" group="alerts" position="top center" width="50%">
    <template #body="props">
      <VAlert :type="props.item.type" class="ma-1" density="compact">
        <div v-html="props.item.text" data-cy="page-title"></div>
        <template #close>
          <VIcon @click.stop="props.close" icon="mdi-close" />
        </template>
      </VAlert>
    </template>
  </notifications>
  <VApp :theme="theme">
    <ASystemBar />
    <VMain>
      <slot></slot>
    </VMain>
  </VApp>
</template>
