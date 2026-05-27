<script setup lang="ts">
import PublicExportListView from '@/views/coreDam/publicExport/PublicExportListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.publicExport.list',
  },
})
</script>

<template>
  <PublicExportListView />
</template>
