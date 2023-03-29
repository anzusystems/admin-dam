<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import {
  useDistributionCategoryDetailActions
} from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryDetail from '@/views/coreDam/distributionCategory/components/DistributionCategoryDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, distributionCategory } = useDistributionCategoryDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="distributionCategory.name">
    <template #buttons>
      <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategoryDetail />
    </VCardText>
  </ACard>
</template>
