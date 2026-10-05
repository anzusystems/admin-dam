<script setup lang="ts">
import PublicExportListView from '@/domains/coreDam/publicExport/components/PublicExportListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PUBLIC_EXPORT_READ],
    // TODO(BE): core-dam checks dam_publicExport_read on the list without a record, which its ext system voter denies to
    // all but a super admin; should be [_ui, _read] (ACL BE task #86852/2.12).
    superAdminOf: 'dam',
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.publicExport.list',
  },
})
</script>

<template>
  <PublicExportListView />
</template>
