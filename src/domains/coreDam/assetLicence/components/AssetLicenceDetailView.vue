<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAssetLicenceDetailActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'
import AssetLicenceDetail from '@/domains/coreDam/assetLicence/components/AssetLicenceDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, assetLicence } = useAssetLicenceDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetLicence.list'), routeName: '/(coreDam)/asset-licences' },
    {
      title: assetLicence.value.name || t('breadcrumb.coreDam.assetLicence.detail'),
      routeName: '/(coreDam)/asset-licences/[id]',
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
      <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/asset-licences/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/asset-licences'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceDetail />
    </VCardText>
  </ACard>
</template>
