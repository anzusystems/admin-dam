<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useKeywordEditActions } from '@/views/coreDam/keyword/composables/keywordActions'
import KeywordEditForm from '@/views/coreDam/keyword/components/KeywordEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, keyword } =
  useKeywordEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.keyword.list'), routeName: '/(coreDam)/keyword' },
    {
      title: keyword.value.name || t('breadcrumb.coreDam.keyword.edit'),
      routeName: '/(coreDam)/keyword/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/keyword'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <KeywordEditForm />
    </VCardText>
  </ACard>
</template>
