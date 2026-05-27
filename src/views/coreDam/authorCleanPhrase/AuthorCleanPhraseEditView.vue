<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAuthorCleanPhraseEditActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhraseEditForm from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const {
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  saveButtonLoading,
  saveAndCloseButtonLoading,
  authorCleanPhrase,
} = useAuthorCleanPhraseEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.authorCleanPhrase.list'), routeName: '/(coreDam)/author-clean-phrases' },
    {
      title: authorCleanPhrase.value.phrase || t('breadcrumb.coreDam.authorCleanPhrase.edit'),
      routeName: '/(coreDam)/author-clean-phrases/[id]/edit',
    },
  ])
)

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="'/(coreDam)/author-clean-phrases/[id]'" :route-params="{ id: id }" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorCleanPhraseEditForm />
    </VCardText>
  </ACard>
</template>
