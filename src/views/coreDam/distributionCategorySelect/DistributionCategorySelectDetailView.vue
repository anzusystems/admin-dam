<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import {
  useDistributionCategorySelectDetailActions
} from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectDetail
  from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore } = useDistributionCategorySelectDetailActions()

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
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectDetail />
    </VCardText>
  </ACard>
</template>
