<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDistributionCategorySelectEditActions } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectEditForm from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    {
      title: t('breadcrumb.coreDam.distributionCategorySelect.list'),
      routeName: '/(coreDam)/distribution-category-select',
    },
    {
      title: distributionCategorySelect.value.id || t('breadcrumb.coreDam.distributionCategorySelect.edit'),
      routeName: '/(coreDam)/distribution-category-select/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/distribution-category-select'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectEditForm />
    </VCardText>
  </ACard>
</template>
