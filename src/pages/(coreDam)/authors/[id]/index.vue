<script setup lang="ts">
import AuthorDetailView from '@/views/coreDam/author/AuthorDetailView.vue'
import { ACL } from '@/composables/auth/auth'

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
