<script setup lang="ts">
import AuthorEditView from '@/views/coreDam/author/AuthorEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_READ, ACL.DAM_AUTHOR_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.author.edit',
  },
})
</script>

<template>
  <AuthorEditView />
</template>
