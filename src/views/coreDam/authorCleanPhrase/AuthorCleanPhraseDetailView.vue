<script lang="ts" setup>
import { AActionCloseButton, AActionDeleteButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import {
  useAuthorCleanPhraseDetailActions,
  useAuthorCleanPhraseRemoveActions,
} from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhraseDetail from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, authorCleanPhrase } = useAuthorCleanPhraseDetailActions()
const { removeAuthorCleanPhrase } = useAuthorCleanPhraseRemoveActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.authorCleanPhrase.list'), routeName: '/(coreDam)/author-clean-phrases' },
    {
      title: authorCleanPhrase.value.phrase || t('breadcrumb.coreDam.authorCleanPhrase.detail'),
      routeName: '/(coreDam)/author-clean-phrases/[id]',
    },
  ])
)

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: id }"
          :route-name="'/(coreDam)/author-clean-phrases/[id]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removeAuthorCleanPhrase(id)"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/author-clean-phrases'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorCleanPhraseDetail />
    </VCardText>
  </ACard>
</template>
