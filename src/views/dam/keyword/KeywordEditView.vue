<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useKeywordEditActions } from '@/views/dam/keyword/composables/keywordActions'
import KeywordEditForm from '@/views/dam/keyword/components/KeywordEditForm.vue'

const { t } = useI18n()

const route = useRoute()
const id = route.params.id.toString()

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate } =
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
  <ActionbarTitleWrapper :heading="t('coreDam.keyword.meta.edit')" icon="mdi-file-key-outline" />
  <ActionbarButtonsWrapper>
    <ASaveButton
      v-if="!detailLoading"
      :loading="saveButtonLoading"
      :disabled="saveAndCloseButtonLoading"
      @save-record="onUpdate"
    />
    <ASaveAndCloseButton
      v-if="!detailLoading"
      :loading="saveAndCloseButtonLoading"
      :disabled="saveButtonLoading"
      @save-record-and-close="onUpdate(true)"
    />
    <ACloseButton :route-name="ROUTE.DAM.KEYWORD.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <KeywordEditForm />
  </ACard>
</template>
