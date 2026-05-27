<script setup lang="ts">
import LogListView from '@/views/common/log/LogListView.vue'
import { ACL } from '@/composables/auth/auth'

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
