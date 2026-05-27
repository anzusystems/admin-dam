<script setup lang="ts">
import ClosePageView from '@/views/system/ClosePageView.vue'

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
