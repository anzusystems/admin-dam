<script setup lang="ts">
import PublicExportDetailView from '@/domains/coreDam/publicExport/components/PublicExportDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/public-exports/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ],
    // TODO(BE): core-dam's ext system voter denies a public export to all but a super admin, the record included
    // (PublicExport is no ExtSystemInterface) (ACL BE task #86852/2.12).
    superAdminOf: 'dam',
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.publicExport.detail',
  },
})
</script>

<template>
  <PublicExportDetailView />
</template>
