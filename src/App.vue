<script lang="ts" setup>
import '@/styles/main.scss'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { onMounted } from 'vue'
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
