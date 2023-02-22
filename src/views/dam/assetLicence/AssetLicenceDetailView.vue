<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { useAssetLicenceDetailActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'
import AssetLicenceDetail from '@/views/dam/assetLicence/components/AssetLicenceDetail.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
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
      <AEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.ASSET_LICENCE.EDIT" />
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.ASSET_LICENCE.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <AssetLicenceDetail />
  </ACard>
</template>
