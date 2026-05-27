<script setup lang="ts">
import AuthorCleanPhraseListView from '@/views/coreDam/authorCleanPhrase/AuthorCleanPhraseListView.vue'
import { ACL } from '@/composables/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.list',
  },
})
</script>

<template>
  <AuthorCleanPhraseListView />
</template>
