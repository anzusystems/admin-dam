<script setup lang="ts">
import UserDetailView from '@/domains/coreDam/user/components/UserDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
