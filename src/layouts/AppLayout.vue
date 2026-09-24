<script lang="ts" setup>
import { shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const defaultLayout = 'AppLayoutLoader'

const layout = shallowRef(defaultLayout)

const route = useRoute()

watch(
  () => route.meta,
  async (meta) => {
    try {
      layout.value = meta.layout || defaultLayout
    } catch (e) {
      console.error(e)
      layout.value = defaultLayout
    }
  }
)
</script>

<template>
  <component :is="layout">
    <slot />
  </component>
</template>
