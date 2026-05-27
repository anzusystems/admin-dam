<script setup lang="ts">
import AuthorDetailView from '@/domains/coreDam/author/components/AuthorDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.author.detail',
  },
})
</script>

<template>
  <AuthorDetailView />
</template>
