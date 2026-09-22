<script setup lang="ts">
import UserListView from '@/domains/coreDam/user/components/UserListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.user.list',
  },
})
</script>

<template>
  <UserListView />
</template>
