<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import {
  useDistributionCategoryEditActions
} from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryEditForm
  from '@/views/coreDam/distributionCategory/components/DistributionCategoryEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = route.params.id.toString()

const { saveAndCloseButtonLoading, saveButtonLoading, detailLoading, fetchData, resetStore, onUpdate } =
  useDistributionCategoryEditActions()

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
  <ActionbarWrapper>
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategoryEditForm />
    </VCardText>
  </ACard>
</template>
