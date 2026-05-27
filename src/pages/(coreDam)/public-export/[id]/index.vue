<script setup lang="ts">
import PublicExportDetailView from '@/views/coreDam/publicExport/PublicExportDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/public-export/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.publicExport.detail',
  },
})
</script>

<template>
  <PublicExportDetailView />
</template>
