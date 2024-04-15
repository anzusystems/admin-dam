<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import AssetLicenceGroupDatatable from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupDatatable.vue'
import { ref } from 'vue'
import { useAssetLicenceGroupListActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import AssetLicenceGroupCreateButton
  from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupCreateButton.vue'
import { ACL } from '@/types/Permission'

const { listLoading } = useAssetLicenceGroupListActions()

const datatable = ref<InstanceType<typeof AssetLicenceGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
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
