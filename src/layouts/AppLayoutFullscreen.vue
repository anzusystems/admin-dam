<script lang="ts" setup>
import { useTheme } from '@/composables/system/themeSettings'
import ASystemBar from '@/components/system/ASystemBar.vue'

const { theme } = useTheme()
</script>

<template>
  <notifications :max="5" group="alerts" position="top center" width="50%">
    <template #body="props">
      <VAlert :type="props.item.type" class="ma-1" density="compact">
        <div data-cy="page-title" v-html="props.item.text" />
        <template #close>
          <VIcon icon="mdi-close" @click.stop="props.close" />
        </template>
      </VAlert>
    </template>
  </notifications>
  <VApp :theme="theme">
    <ASystemBar />
    <VMain>
      <slot />
    </VMain>
  </VApp>
</template>
