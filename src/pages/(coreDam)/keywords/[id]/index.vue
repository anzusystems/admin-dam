<script setup lang="ts">
import KeywordDetailView from '@/domains/coreDam/keyword/components/KeywordDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/keywords/:id([0-9a-f-]{36})',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_KEYWORD_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.keyword.detail',
  },
})
</script>

<template>
  <KeywordDetailView />
</template>
