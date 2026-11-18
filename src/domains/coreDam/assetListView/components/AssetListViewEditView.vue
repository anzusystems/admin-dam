<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AssetListViewEditForm from '@/domains/coreDam/assetListView/components/AssetListViewEditForm.vue'
import { useAssetListViewEditActions } from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, assetListView } =
  useAssetListViewEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.coreDam.assetListView.list'), routeName: '/(coreDam)/asset-list-views' },
  {
    title: assetListView.value.name || t('breadcrumb.coreDam.assetListView.edit'),
    routeName: '/(coreDam)/asset-list-views/[id]/edit',
  },
])

useRecordPage({
  fallbackRouteName: '/(coreDam)/asset-list-views',
  skipRouteNames: ['/(coreDam)/asset-list-views/[id]'],
  loading: detailLoading,
  load: (signal) => fetchData(id, { signal }),
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
        :fallback-route-name="'/(coreDam)/asset-list-views'"
        :skip-route-names="['/(coreDam)/asset-list-views/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetListViewEditForm />
    </VCardText>
  </ACard>
</template>
