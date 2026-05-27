<script setup lang="ts">
import PermissionGroupListView from '@/views/common/permissionGroup/PermissionGroupListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.permissionGroup.list',
  },
})
</script>

<template>
  <PermissionGroupListView />
</template>
