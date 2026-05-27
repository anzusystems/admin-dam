<script setup lang="ts">
import PermissionGroupDetailView from '@/views/common/permissionGroup/PermissionGroupDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/permission-groups/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.permissionGroup.detail',
  },
})
</script>

<template>
  <PermissionGroupDetailView />
</template>
