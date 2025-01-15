<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { ref } from 'vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'
import AuthorCleanPhraseDatatable
  from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseDatatable.vue'
import AuthorCleanPhraseCreateButton
  from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseCreateButton.vue'
import { useAuthorCleanPhraseListActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhrasePlaygroundButton
  from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhrasePlaygroundButton.vue'

const { listLoading } = useAuthorCleanPhraseListActions()

const datatable = ref<InstanceType<typeof AuthorCleanPhraseDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_CREATE">
        <AuthorCleanPhraseCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_READ">
        <AuthorCleanPhrasePlaygroundButton
          data-cy="button-playground"
          disable-redirect
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AuthorCleanPhraseDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
