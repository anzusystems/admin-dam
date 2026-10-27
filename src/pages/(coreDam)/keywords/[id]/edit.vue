<script setup lang="ts">
import KeywordEditView from '@/domains/coreDam/keyword/components/KeywordEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/keywords/:id([0-9a-f-]{36})/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_KEYWORD_READ, ACL.DAM_KEYWORD_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.keyword.edit',
  },
})
</script>

<template>
  <KeywordEditView />
</template>
