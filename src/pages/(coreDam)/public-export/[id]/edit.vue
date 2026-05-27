<script setup lang="ts">
import PublicExportEditView from '@/views/coreDam/publicExport/PublicExportEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/public-export/:id(\\d+)/edit',
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
