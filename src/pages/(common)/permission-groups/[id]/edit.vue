<script setup lang="ts">
import PermissionGroupEditView from '@/domains/common/permissionGroup/components/PermissionGroupEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/permission-groups/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_READ, ACL.DAM_PERMISSION_GROUP_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.permissionGroup.edit',
  },
})
</script>

<template>
  <PermissionGroupEditView />
</template>
