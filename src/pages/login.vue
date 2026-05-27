<script setup lang="ts">
import LoginView from '@/views/system/LoginView.vue'

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
