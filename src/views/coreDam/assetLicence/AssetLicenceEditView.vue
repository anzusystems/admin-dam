<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAssetLicenceEditActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import AssetLicenceEditForm from '@/views/coreDam/assetLicence/components/AssetLicenceEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, assetLicence } =
  useAssetLicenceEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetLicence.list'), routeName: '/(coreDam)/asset-licences' },
    {
      title: assetLicence.value.name || t('breadcrumb.coreDam.assetLicence.edit'),
      routeName: '/(coreDam)/asset-licences/[id]/edit',
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="'/(coreDam)/asset-licences'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceEditForm />
    </VCardText>
  </ACard>
</template>
