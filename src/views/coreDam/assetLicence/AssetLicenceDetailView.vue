<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionEditButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useAssetLicenceDetailActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import AssetLicenceDetail from '@/views/coreDam/assetLicence/components/AssetLicenceDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, assetLicence } = useAssetLicenceDetailActions()

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
  <ActionbarWrapper :last-breadcrumb-title="assetLicence.name">
    <template #buttons>
      <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/asset-licence/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/asset-licence'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceDetail />
    </VCardText>
  </ACard>
</template>
