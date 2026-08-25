<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAssetLicenceGroupDetailActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupDetail from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, assetLicenceGroup } = useAssetLicenceGroupDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetLicenceGroup.list'), routeName: '/(coreDam)/asset-licence-groups' },
    {
      title: assetLicenceGroup.value.name || t('breadcrumb.coreDam.assetLicenceGroup.detail'),
      routeName: '/(coreDam)/asset-licence-groups/[id]',
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
      <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/asset-licence-groups/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/asset-licence-groups'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceGroupDetail />
    </VCardText>
  </ACard>
</template>
