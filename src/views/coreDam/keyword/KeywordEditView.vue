<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useKeywordEditActions } from '@/views/coreDam/keyword/composables/keywordActions'
import KeywordEditForm from '@/views/coreDam/keyword/components/KeywordEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = route.params.id.toString()

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, keyword } =
  useKeywordEditActions()

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
  <ActionbarWrapper :last-breadcrumb-title="keyword.name">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.KEYWORD.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <KeywordEditForm />
    </VCardText>
  </ACard>
</template>
