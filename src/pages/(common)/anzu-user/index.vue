<script setup lang="ts">
import AnzuUserListView from '@/views/common/anzuUser/AnzuUserListView.vue'
import { ACL } from '@/composables/auth/auth'

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
