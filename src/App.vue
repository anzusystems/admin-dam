<script lang="ts" setup>
import '@/styles/main.scss'
import { useDropzoneGlobalDragState } from '@anzusystems/common-admin'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppLayout from '@/layouts/AppLayout.vue'
import { envConfig } from '@/shared/EnvConfigService'

const route = useRoute()
const { initGlobalDragState } = useDropzoneGlobalDragState()

// Prefixes the title with the environment name, so a non-production tab shows it at once.
// Production sets no label and keeps the plain title.
const title = useTitle()

onMounted(async () => {
  initGlobalDragState()
  title.value = (envConfig.appLabel ? envConfig.appLabel + ': ' : '') + 'ADAM'
})
</script>

<template>
  <AppLayout>
    <RouterView :key="route.path" />
  </AppLayout>
</template>
