<script setup lang="ts">
import LoginView from '@/domains/system/views/LoginView.vue'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})
</script>

<template>
  <LoginView />
</template>
