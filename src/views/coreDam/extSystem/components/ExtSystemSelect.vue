<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import { AFormRemoteAutocomplete, type IntegerId, type IntegerIdNullable } from '@anzusystems/common-admin'
import { useExtSystemSelectActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import { useExtSystemFilter } from '@/model/coreDam/filter/ExtSystemFilter'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | number[] | any
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    dataCy?: string
    hideDetails?: boolean
    disableInitFetch?: boolean
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    clearable: false,
    dataCy: '',
    hideDetails: undefined,
    disableInitFetch: false,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: IntegerIdNullable | IntegerId[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = useExtSystemSelectActions()

const innerFilter = useExtSystemFilter()
</script>

<template>
  <AFormRemoteAutocomplete
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
    :hide-details="hideDetails"
    :disable-init-fetch="disableInitFetch"
  />
</template>
