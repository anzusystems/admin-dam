<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAssetLicenceGroupDetailActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupDetail from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, assetLicenceGroup } = useAssetLicenceGroupDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetLicenceGroup.list'), routeName: '/(coreDam)/asset-licence-group' },
    {
      title: assetLicenceGroup.value.name || t('breadcrumb.coreDam.assetLicenceGroup.detail'),
      routeName: '/(coreDam)/asset-licence-group/[id]',
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
          :route-name="'/(coreDam)/asset-licence-group/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/asset-licence-group'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceGroupDetail />
    </VCardText>
  </ACard>
</template>
