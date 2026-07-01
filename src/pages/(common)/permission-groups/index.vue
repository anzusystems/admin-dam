<script setup lang="ts">
import PermissionGroupListView from '@/domains/common/permissionGroup/components/PermissionGroupListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
