<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { useAssetLicenceDetailActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'
import AssetLicenceDetail from '@/views/dam/assetLicence/components/AssetLicenceDetail.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ACard } from '@anzusystems/common-admin'

const { detailLoading, fetchData, resetStore } = useAssetLicenceDetailActions()

const route = useRoute()
const id = toInt(route.params.id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.assetLicence.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
      <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.ASSET_LICENCE.EDIT" />
    </Acl>
    <AActionCloseButton :route-name="ROUTE.DAM.ASSET_LICENCE.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <AssetLicenceDetail />
  </ACard>
</template>
