<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import {
  AActionCloseButton,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  stringToInt,
} from '@anzusystems/common-admin'
import {
  useAuthorCleanPhraseDetailActions,
  useAuthorCleanPhraseRemoveActions,
} from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhraseDetail from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, authorCleanPhrase } = useAuthorCleanPhraseDetailActions()
const { removeAuthorCleanPhrase } = useAuthorCleanPhraseRemoveActions()

const route = useRoute()
const id = stringToInt(route.params.id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="authorCleanPhrase.phrase">
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: id }"
          :route-name="ROUTE.DAM.AUTHOR_CLEAN_PHRASE.EDIT"
        />
      </Acl>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removeAuthorCleanPhrase(id)"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.AUTHOR_CLEAN_PHRASE.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorCleanPhraseDetail />
    </VCardText>
  </ACard>
</template>
