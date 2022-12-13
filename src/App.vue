<script lang="ts" setup>
import '@/styles/main.scss'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { useLocaleSettings } from '@/composables/system/localeSettings'
import { onMounted } from 'vue'
import { useWindowFilesDragWatcher } from '@/composables/system/windowFilesDragWatcher'

const route = useRoute()
const { initializeLocale } = useLocaleSettings()

onMounted(() => {
  initializeLocale()
  useWindowFilesDragWatcher()
})
</script>

<template>
  <AppLayout>
    <RouterView :key="route.path" />
  </AppLayout>
</template>
