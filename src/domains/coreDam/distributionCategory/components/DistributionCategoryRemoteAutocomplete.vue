<script lang="ts" setup>
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useDistributionCategorySelectActions } from '@/domains/coreDam/distributionCategory/composables/distributionCategoryActions'
import { useDistributionCategoryFilter } from '@/domains/coreDam/distributionCategory/filter/DistributionCategoryFilter'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    disableInitFetch?: boolean
    dataCy?: string
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    clearable: false,
    disableInitFetch: false,
    dataCy: '',
  }
)
const modelValue = defineModel<string | number | null | string[] | number[]>({ required: true })
// AFormRemoteAutocomplete's model-value accepts only string ids — narrow the wider prop here.
const innerModelValue = computed(() => modelValue.value as string | string[] | null)

const { fetchItems, fetchItemsByIds } = useDistributionCategorySelectActions()

const { filterData, filterConfig } = useDistributionCategoryFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

watch(
  () => props.assetType,
  (newValue) => {
    filterData.type = newValue
  },
  { immediate: true }
)
</script>

<template>
  <AFormRemoteAutocomplete
    :model-value="innerModelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="name"
    :data-cy="dataCy"
    :prefetch="disableInitFetch ? false : 'hover'"
    @update:model-value="modelValue = $event ?? null"
  />
</template>
