<script setup lang="ts">
import AnzuUserListView from '@/domains/common/anzuUser/components/AnzuUserListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.anzuUser.list',
  },
})
</script>

<template>
  <AnzuUserListView />
</template>
