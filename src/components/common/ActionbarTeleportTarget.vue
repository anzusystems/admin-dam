<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { useActionbar } from '@/composables/system/actionbar'

const { mounted, unMounted } = useActionbar()

onMounted(async () => {
  await nextTick()
  mounted()
})

onBeforeUnmount(() => {
  unMounted()
})
</script>

<template>
  <div class="w-100 d-flex justify-space-between align-center">
    <div id="anzu-actionbar-title"></div>
    <div id="anzu-actionbar-buttons" class="pr-2"></div>
  </div>
</template>
