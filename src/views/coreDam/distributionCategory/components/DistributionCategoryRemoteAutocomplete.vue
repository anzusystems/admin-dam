<script lang="ts" setup>
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete } from '@anzusystems/common-admin'
import { useDistributionCategorySelectActions } from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import { useDistributionCategoryFilter } from '@/model/coreDam/filter/DistributionCategoryFilter'
import { onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | string[] | number[]
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
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | number | null | string[] | number[]): void
}>()

const { fetchItems, fetchItemsByIds } = useDistributionCategorySelectActions()

const innerFilter = useDistributionCategoryFilter()

onMounted(() => {
  innerFilter.type.model = props.assetType
})
</script>

<template>
  <AFormRemoteAutocomplete
    :model-value="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="name"
    :data-cy="dataCy"
    :disable-init-fetch="disableInitFetch"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
