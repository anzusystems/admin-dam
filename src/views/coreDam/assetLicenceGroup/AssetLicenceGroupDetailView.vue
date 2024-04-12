<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionEditButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useAssetLicenceGroupDetailActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupDetail from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupDetail.vue'
import { ACL } from '@/types/Permission'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, assetLicenceGroup } = useAssetLicenceGroupDetailActions()

const route = useRoute()
const id = stringToInt(route.params.id)

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
  <ActionbarWrapper :last-breadcrumb-title="assetLicenceGroup.name">
    <template #buttons>
      <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.ASSET_LICENCE_GROUP.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.ASSET_LICENCE_GROUP.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceGroupDetail />
    </VCardText>
  </ACard>
</template>
