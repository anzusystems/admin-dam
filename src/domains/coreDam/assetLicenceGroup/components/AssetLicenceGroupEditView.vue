<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAssetLicenceGroupEditActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupEditForm from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

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
    { title: t('breadcrumb.coreDam.assetLicenceGroup.list'), routeName: '/(coreDam)/asset-licence-groups' },
    {
      title: assetLicenceGroup.value.name || t('breadcrumb.coreDam.assetLicenceGroup.edit'),
      routeName: '/(coreDam)/asset-licence-groups/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/asset-licence-groups'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceGroupEditForm />
    </VCardText>
  </ACard>
</template>
