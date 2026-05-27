<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAssetLicenceGroupEditActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupEditForm from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const {
  detailLoading,
  saveButtonLoading,
  saveAndCloseButtonLoading,
  fetchData,
  resetStore,
  onUpdate,
  assetLicenceGroup,
} = useAssetLicenceGroupEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.assetLicenceGroup.list'), routeName: '/(coreDam)/asset-licence-group' },
    {
      title: assetLicenceGroup.value.name || t('breadcrumb.coreDam.assetLicenceGroup.edit'),
      routeName: '/(coreDam)/asset-licence-group/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/asset-licence-group'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceGroupEditForm />
    </VCardText>
  </ACard>
</template>
