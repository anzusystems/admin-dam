<script setup lang="ts">
import AuthorCleanPhraseEditView from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseEditView.vue'
import { ACL } from '@/domains/system/auth/auth'

definePage({
  path: '/author-clean-phrases/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_AUTHOR_CLEAN_PHRASE_READ, ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE],
    // TODO(BE): core-dam checks dam_authorCleanPhrase_update without the record, a 403 for all but a super admin;
    // drop this once the check takes the record (ACL BE task 3.11).
    superAdminOf: 'dam',
    layout: 'AppLayoutDrawer',
    breadcrumbT: 'breadcrumb.coreDam.authorCleanPhrase.edit',
  },
})
</script>

<template>
  <AuthorCleanPhraseEditView />
</template>
