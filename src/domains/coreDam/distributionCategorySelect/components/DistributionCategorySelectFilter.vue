<script lang="ts" setup>
import { useAssetType } from '@/domains/coreDam/asset/valueObject/DamAssetType'
import {
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useDistributionCategorySelectListActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useDistributionCategorySelectListActions()

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    enable-top
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #top>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <AFilterValueObjectOptionsSelect
            name="type"
            :items="assetTypeOptions"
          />
        </VCol>
      </VRow>
    </template>
    <template #search>
      <AFilterString name="serviceSlug" />
    </template>
  </AFilterWrapper>
</template>
