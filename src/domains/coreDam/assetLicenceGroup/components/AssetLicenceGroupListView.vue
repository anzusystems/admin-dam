<script lang="ts" setup>
import { ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'

import AssetLicenceGroupCreateButton from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupCreateButton.vue'
import AssetLicenceGroupDatatable from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupDatatable.vue'
import { useAssetLicenceGroupListActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useAssetLicenceGroupListActions()

const datatable = ref<InstanceType<typeof AssetLicenceGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetLicenceGroup.list'), routeName: '/(coreDam)/asset-licence-groups' },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_CREATE">
        <AssetLicenceGroupCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AssetLicenceGroupDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
