<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useAssetLicenceGroupEditActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupEditForm from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const {
  detailLoading,
  saveButtonLoading,
  saveAndCloseButtonLoading,
  fetchData,
  resetStore,
  onUpdate,
  assetLicenceGroup
} =
  useAssetLicenceGroupEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="assetLicenceGroup.name">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.ASSET_LICENCE_GROUP.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceGroupEditForm />
    </VCardText>
  </ACard>
</template>
