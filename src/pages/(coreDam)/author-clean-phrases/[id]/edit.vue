<script setup lang="ts">
import AuthorCleanPhraseEditView from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ, ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE],
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.edit',
  },
})
</script>

<template>
  <AuthorCleanPhraseEditView />
</template>
