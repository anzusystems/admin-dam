<script lang="ts" setup>
import { ACard, defineBreadcrumbs } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetListViewCreateButton from '@/domains/coreDam/assetListView/components/AssetListViewCreateButton.vue'
import AssetListViewDatatable from '@/domains/coreDam/assetListView/components/AssetListViewDatatable.vue'
import { useAssetListViewListActions } from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useAssetListViewListActions()

const datatable = ref<InstanceType<typeof AssetListViewDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.coreDam.assetListView.list'), routeName: '/(coreDam)/asset-list-views' },
])
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_ASSET_LIST_VIEW_CREATE">
        <AssetListViewCreateButton
          data-cy="button-create"
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AssetListViewDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
