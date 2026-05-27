<script setup lang="ts">
import LogDetailView from '@/views/common/log/LogDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_LOG_UI],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.log.detail',
  },
})
</script>

<template>
  <LogDetailView />
</template>
