<script setup lang="ts">
import PublicExportDetailView from '@/domains/coreDam/publicExport/components/PublicExportDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/public-exports/:id(\\d+)',
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
