<script setup lang="ts">
import AnzuUserDetailView from '@/domains/common/anzuUser/components/AnzuUserDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/anzu-users/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.anzuUser.detail',
  },
})
</script>

<template>
  <AnzuUserDetailView />
</template>
