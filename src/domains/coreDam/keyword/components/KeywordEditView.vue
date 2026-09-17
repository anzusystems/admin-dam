<script lang="ts" setup>
import { AActionCloseButtonHistory, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useKeywordEditActions } from '@/domains/coreDam/keyword/composables/keywordActions'
import KeywordEditForm from '@/domains/coreDam/keyword/components/KeywordEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, keyword } =
  useKeywordEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.keyword.list'), routeName: '/(coreDam)/keywords' },
    {
      title: keyword.value.name || t('breadcrumb.coreDam.keyword.edit'),
      routeName: '/(coreDam)/keywords/[id]/edit',
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
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/keywords'"
        :skip-route-names="['/(coreDam)/keywords/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <KeywordEditForm />
    </VCardText>
  </ACard>
</template>
