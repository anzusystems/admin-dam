<script setup lang="ts">
import LogDetailView from '@/domains/common/log/components/LogDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
