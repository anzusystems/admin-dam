<script setup lang="ts">
import AuthorCleanPhraseListView from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseListView.vue'
import { ACL } from '@/domains/system/auth/auth'

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
