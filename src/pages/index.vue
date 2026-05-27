<script setup lang="ts">
import HomepageView from '@/domains/system/views/HomepageView.vue'

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
