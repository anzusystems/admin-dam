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

// The environment's own name in front of the title, so a tab that is not production says so before
// anything on the page does. Production sets no label, and the title is then what it always was.
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
