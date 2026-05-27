<script setup lang="ts">
import AnzuUserEditView from '@/domains/common/anzuUser/components/AnzuUserEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/anzu-users/:id(\\d+)/edit',
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
