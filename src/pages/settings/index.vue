<script setup lang="ts">
import SettingsView from '@/domains/system/views/settings/SettingsView.vue'

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
