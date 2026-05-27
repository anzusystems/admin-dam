<script setup lang="ts">
import SettingsView from '@/views/system/settings/SettingsView.vue'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.settings',
  },
})
</script>

<template>
  <SettingsView />
</template>
