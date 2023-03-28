<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import DistributionCategorySelectDatatable
  from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectDatatable.vue'
import {
  useDistributionCategorySelectListActions
} from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { listLoading } = useDistributionCategorySelectListActions()
</script>

<template>
  <ActionbarWrapper />

  <ACard :loading="listLoading">
    <VCardText>
      <DistributionCategorySelectDatatable />
    </VCardText>
  </ACard>
</template>
