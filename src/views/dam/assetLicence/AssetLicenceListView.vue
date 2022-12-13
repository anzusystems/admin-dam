<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import AssetLicenceDatatable from '@/views/dam/assetLicence/components/AssetLicenceDatatable.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import AssetLicenceCreateButton from '@/views/dam/assetLicence/components/AssetLicenceCreateButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.assetLicence.meta.list')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_CREATE">
      <AssetLicenceCreateButton data-cy="button-create"></AssetLicenceCreateButton>
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard loader="list">
    <AssetLicenceDatatable></AssetLicenceDatatable>
  </ACard>
</template>
