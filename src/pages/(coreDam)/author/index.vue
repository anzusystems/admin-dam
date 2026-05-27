<script setup lang="ts">
import AuthorListView from '@/views/coreDam/author/AuthorListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.author.list',
  },
})
</script>

<template>
  <AuthorListView />
</template>
