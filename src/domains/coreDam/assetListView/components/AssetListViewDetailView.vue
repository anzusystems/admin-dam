<script lang="ts" setup>
import { AActionCloseButton, AActionDeleteButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import {
  useAssetListViewDetailActions,
  useAssetListViewRemoveActions,
} from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import AssetListViewDetail from '@/domains/coreDam/assetListView/components/AssetListViewDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, assetListView } = useAssetListViewDetailActions()
const { removeAssetListView } = useAssetListViewRemoveActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetListView.list'), routeName: '/(coreDam)/asset-list-views' },
    {
      title: assetListView.value.name || t('breadcrumb.coreDam.assetListView.detail'),
      routeName: '/(coreDam)/asset-list-views/[id]',
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
      <AActionCloseButton :route-name="'/(coreDam)/asset-list-views'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetListViewDetail />
    </VCardText>
  </ACard>
</template>
