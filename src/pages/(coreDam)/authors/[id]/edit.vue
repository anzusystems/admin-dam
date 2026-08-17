<script setup lang="ts">
import AuthorEditView from '@/domains/coreDam/author/components/AuthorEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
