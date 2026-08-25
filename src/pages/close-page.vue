<script setup lang="ts">
import ClosePageView from '@/domains/system/views/ClosePageView.vue'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})
</script>

<template>
  <ClosePageView />
</template>
