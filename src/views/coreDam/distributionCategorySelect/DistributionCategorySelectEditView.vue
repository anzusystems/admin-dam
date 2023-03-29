<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import {
  useDistributionCategorySelectEditActions
} from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectEditForm
  from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = route.params.id.toString()

const {
  saveButtonLoading,
  saveAndCloseButtonLoading,
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  distributionCategorySelect,
} =
  useDistributionCategorySelectEditActions()

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
  <ActionbarWrapper :last-breadcrumb-title="distributionCategorySelect.id">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectEditForm />
    </VCardText>
  </ACard>
</template>
