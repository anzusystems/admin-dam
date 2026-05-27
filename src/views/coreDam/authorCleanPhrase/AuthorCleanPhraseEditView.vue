<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, stringToInt, useI18n } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorCleanPhraseEditActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhraseEditForm from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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
    { title: t('breadcrumb.coreDam.authorCleanPhrase.list'), routeName: '/(coreDam)/author-clean-phrase' },
    {
      title: authorCleanPhrase.value.phrase || t('breadcrumb.coreDam.authorCleanPhrase.edit'),
      routeName: '/(coreDam)/author-clean-phrase/[id]/edit',
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
      <AActionCloseButton
        :route-name="'/(coreDam)/author-clean-phrase/[id]'"
        :route-params="{ id: id }"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorCleanPhraseEditForm />
    </VCardText>
  </ACard>
</template>
