<script setup lang="ts">
import KeywordEditView from '@/views/coreDam/keyword/KeywordEditView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
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
