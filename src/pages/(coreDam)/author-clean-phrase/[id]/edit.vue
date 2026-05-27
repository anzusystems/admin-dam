<script setup lang="ts">
import AuthorCleanPhraseEditView from '@/views/coreDam/authorCleanPhrase/AuthorCleanPhraseEditView.vue'
import { ACL } from '@/composables/auth/auth'

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
