<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useAuthorCleanPhraseEditActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhraseEditForm from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { detailLoading, fetchData, resetStore, onUpdate, saveButtonLoading, saveAndCloseButtonLoading,
  authorCleanPhrase } = useAuthorCleanPhraseEditActions()

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
  <ActionbarWrapper :last-breadcrumb-title="authorCleanPhrase.phrase">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton
        :route-name="ROUTE.DAM.AUTHOR_CLEAN_PHRASE.DETAIL"
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
