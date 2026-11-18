<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AssetListViewDetail from '@/domains/coreDam/assetListView/components/AssetListViewDetail.vue'
import {
  useAssetListViewDetailActions,
  useAssetListViewRemoveActions,
} from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, assetListView } = useAssetListViewDetailActions()
const { removeAssetListView } = useAssetListViewRemoveActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.coreDam.assetListView.list'), routeName: '/(coreDam)/asset-list-views' },
  {
    title: assetListView.value.name || t('breadcrumb.coreDam.assetListView.detail'),
    routeName: '/(coreDam)/asset-list-views/[id]',
  },
])

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

useRecordPage({
  fallbackRouteName: '/(coreDam)/asset-list-views',
  skipRouteNames: ['/(coreDam)/asset-list-views/[id]/edit'],
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
      <Acl :permission="ACL.DAM_ASSET_LIST_VIEW_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/asset-list-views/[id]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_ASSET_LIST_VIEW_DELETE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removeAssetListView(id)"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/asset-list-views'"
        :skip-route-names="['/(coreDam)/asset-list-views/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetListViewDetail />
    </VCardText>
  </ACard>
</template>
