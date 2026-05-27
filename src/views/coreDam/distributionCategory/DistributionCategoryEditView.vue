<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useDistributionCategoryEditActions } from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryEditForm from '@/views/coreDam/distributionCategory/components/DistributionCategoryEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const {
  saveAndCloseButtonLoading,
  saveButtonLoading,
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  distributionCategory,
} = useDistributionCategoryEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.distributionCategory.list'), routeName: '/(coreDam)/distribution-categories' },
    {
      title: distributionCategory.value.name || t('breadcrumb.coreDam.distributionCategory.edit'),
      routeName: '/(coreDam)/distribution-categories/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/distribution-categories'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategoryEditForm />
    </VCardText>
  </ACard>
</template>
