<script setup lang="ts">
import AnzuUserEditView from '@/views/common/anzuUser/AnzuUserEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  path: '/anzu-user/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ, ACL.DAM_USER_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.anzuUser.edit',
  },
})
</script>

<template>
  <AnzuUserEditView />
</template>
