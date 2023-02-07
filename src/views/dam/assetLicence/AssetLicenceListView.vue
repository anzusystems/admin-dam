<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import AssetLicenceDatatable from '@/views/dam/assetLicence/components/AssetLicenceDatatable.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import AssetLicenceCreateButton from '@/views/dam/assetLicence/components/AssetLicenceCreateButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'
import { useAssetLicenceListActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'

const { t } = useI18n({ useScope: 'global' })

const { listLoading } = useAssetLicenceListActions()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.assetLicence.meta.list')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_CREATE">
      <AssetLicenceCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <AssetLicenceDatatable ref="datatable" />
  </ACard>
</template>
