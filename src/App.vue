<script lang="ts" setup>
import '@/styles/main.scss'
import AppLayout from '@/layouts/AppLayout.vue'
import { useWindowFilesDragWatcher } from '@/domains/coreDam/asset/composables/windowFilesDragWatcher'
import { envConfig } from '@/shared/EnvConfigService'
import { useTitle } from '@vueuse/core'

const route = useRoute()

// The environment's own name in front of the title, so a tab that is not production says so before
// anything on the page does. Production sets no label, and the title is then what it always was.
const title = useTitle()

onMounted(async () => {
  useWindowFilesDragWatcher()
  title.value = (envConfig.appLabel ? envConfig.appLabel + ': ' : '') + 'ADAM'
})
</script>

<template>
  <AppLayout>
    <RouterView :key="route.path" />
  </AppLayout>
</template>
