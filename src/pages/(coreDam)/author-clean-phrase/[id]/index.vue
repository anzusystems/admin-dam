<script setup lang="ts">
import AuthorCleanPhraseDetailView from '@/views/coreDam/authorCleanPhrase/AuthorCleanPhraseDetailView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.detail',
  },
})
</script>

<template>
  <AuthorCleanPhraseDetailView />
</template>
