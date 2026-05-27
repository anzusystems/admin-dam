<script setup lang="ts">
import KeywordListView from '@/views/coreDam/keyword/KeywordListView.vue'
import { ACL } from '@/composables/auth/auth'

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
