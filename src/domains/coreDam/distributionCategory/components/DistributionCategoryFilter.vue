<script lang="ts" setup>
import { useAssetType } from '@/domains/coreDam/asset/valueObject/DamAssetType'
import {
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useDistributionCategoryListActions } from '@/domains/coreDam/distributionCategory/composables/distributionCategoryActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useDistributionCategoryListActions()

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #item.type>
      <AFilterValueObjectOptionsSelect
        name="type"
        :items="assetTypeOptions"
      />
    </template>
  </AFilterWrapper>
</template>
