<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useDistributionCategorySelectEditActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectEditForm from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const {
  saveButtonLoading,
  saveAndCloseButtonLoading,
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  distributionCategorySelect,
} = useDistributionCategorySelectEditActions()

const editForm = ref<InstanceType<typeof DistributionCategorySelectEditForm> | null>(null)

const onSave = () => {
  onUpdate(
    false,
    () => editForm.value?.validateAll() ?? true,
    async () => {
      // Re-baseline the options editor against the saved response so its rows lose the unsaved markers.
      await nextTick()
      editForm.value?.commit()
    }
  )
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    {
      title: t('breadcrumb.coreDam.distributionCategorySelect.list'),
      routeName: '/(coreDam)/distribution-category-selects',
    },
    {
      title: distributionCategorySelect.value.id || t('breadcrumb.coreDam.distributionCategorySelect.edit'),
      routeName: '/(coreDam)/distribution-category-selects/[id]/edit',
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
        @save-record="onSave"
      />
      <AActionCloseButton :route-name="'/(coreDam)/distribution-category-selects'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectEditForm
        v-if="!detailLoading"
        ref="editForm"
      />
    </VCardText>
  </ACard>
</template>
