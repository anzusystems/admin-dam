<script setup lang="ts">
import LogListView from '@/domains/common/log/components/LogListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_LOG_UI],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.log.list',
  },
})
</script>

<template>
  <LogListView />
</template>
