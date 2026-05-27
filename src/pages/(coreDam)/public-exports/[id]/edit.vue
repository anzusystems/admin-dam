<script setup lang="ts">
import PublicExportEditView from '@/domains/coreDam/publicExport/components/PublicExportEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/public-exports/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ, ACL.DAM_PUBLIC_EXPORT_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.publicExport.edit',
  },
})
</script>

<template>
  <PublicExportEditView />
</template>
