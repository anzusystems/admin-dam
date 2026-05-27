<script setup lang="ts">
import KeywordListView from '@/domains/coreDam/keyword/components/KeywordListView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_KEYWORD_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.keyword.list',
  },
})
</script>

<template>
  <KeywordListView />
</template>
