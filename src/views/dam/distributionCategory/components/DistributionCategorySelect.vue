<script lang="ts" setup>
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import { useDistributionCategorySelectActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import { useDistributionCategoryFilter } from '@/model/dam/filter/DistributionCategoryFilter'

withDefaults(
  defineProps<{
    modelValue: string | null | string[] | any
    label?: string | null
    required?: boolean | null
    multiple?: boolean
    clearable?: boolean
    dataCy?: string
  }>(),
  {
    label: null,
    required: null,
    multiple: false,
    clearable: false,
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | null | string[]): void
}>()

const { fetchItems, fetchItemsByIds } = useDistributionCategorySelectActions()

const innerFilter = useDistributionCategoryFilter()
</script>

<template>
  <ARemoteSelect
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="name"
    :data-cy="dataCy"
  />
</template>
