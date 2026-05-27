<script setup lang="ts">
import KeywordDetailView from '@/views/coreDam/keyword/KeywordDetailView.vue'
import { ACL } from '@/composables/auth/auth'

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
