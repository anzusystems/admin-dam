<script setup lang="ts">
import KeywordDetailView from '@/domains/coreDam/keyword/components/KeywordDetailView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
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
