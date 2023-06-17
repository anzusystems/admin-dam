<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useAssetLicenceEditActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import AssetLicenceEditForm from '@/views/coreDam/assetLicence/components/AssetLicenceEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, assetLicence } =
  useAssetLicenceEditActions()

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
  <ActionbarWrapper :last-breadcrumb-title="assetLicence.name">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.ASSET_LICENCE.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceEditForm />
    </VCardText>
  </ACard>
</template>
