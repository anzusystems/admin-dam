<script setup lang="ts">
import UserEditView from '@/views/coreDam/user/UserEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/user/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ, ACL.DAM_USER_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.user.edit',
  },
})
</script>

<template>
  <UserEditView />
</template>
