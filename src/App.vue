<script lang="ts" setup>
import '@/styles/main.scss'
import AppLayout from '@/layouts/AppLayout.vue'
import { useWindowFilesDragWatcher } from '@/composables/system/windowFilesDragWatcher'

const route = useRoute()

onMounted(async () => {
  useWindowFilesDragWatcher()
})
</script>

<template>
  <AppLayout>
    <RouterView :key="route.path" />
  </AppLayout>
</template>
