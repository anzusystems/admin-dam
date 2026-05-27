<script setup lang="ts">
import UserDetailView from '@/views/coreDam/user/UserDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/users/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.user.detail',
  },
})
</script>

<template>
  <UserDetailView />
</template>
