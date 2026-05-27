<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import AssetLicenceDatatable from '@/views/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import AssetLicenceCreateButton from '@/views/coreDam/assetLicence/components/AssetLicenceCreateButton.vue'
import { useAssetLicenceListActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { listLoading } = useAssetLicenceListActions()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.assetLicence.list'), routeName: '/(coreDam)/asset-licences' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_ASSET_LICENCE_CREATE">
        <AssetLicenceCreateButton data-cy="button-create" disable-redirect @on-success="afterCreate" />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AssetLicenceDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
