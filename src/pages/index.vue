<script setup lang="ts">
import HomepageView from '@/views/system/HomepageView.vue'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})
</script>

<template>
  <HomepageView />
</template>
