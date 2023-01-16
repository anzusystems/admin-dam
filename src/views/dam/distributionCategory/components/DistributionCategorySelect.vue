<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import { useDistributionCategorySelectActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import { useDistributionCategoryFilter } from '@/model/dam/filter/DistributionCategoryFilter'

const props = withDefaults(
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
  (e: 'update:modelValue', data: number | null | number[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = useDistributionCategorySelectActions()

const innerFilter = useDistributionCategoryFilter()
</script>

<template>
  <ARemoteSelect
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="name"
    :data-cy="dataCy"
  ></ARemoteSelect>
</template>
