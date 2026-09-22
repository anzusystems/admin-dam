<script setup lang="ts">
import AuthorListView from '@/domains/coreDam/author/components/AuthorListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
