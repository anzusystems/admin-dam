<script setup lang="ts">
import UserListView from '@/views/coreDam/user/UserListView.vue'
import { ACL } from '@/composables/auth/auth'

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
