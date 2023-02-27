<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import { AFormRemoteAutocomplete } from '@anzusystems/common-admin'
import { useUserSelectActions } from '@/views/coreDam/user/composables/userActions'
import { useUserFilter } from '@/model/coreDam/filter/UserFilter'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | number[] | any
    label?: string | null
    required?: boolean | null
    multiple?: boolean
    clearable?: boolean
    disableInitFetch?: boolean
    dataCy?: string
  }>(),
  {
    label: null,
    required: null,
    multiple: false,
    clearable: false,
    disableInitFetch: false,
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: number | null | number[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = useUserSelectActions()

const innerFilter = useUserFilter()
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
    filter-by-field="email"
    :data-cy="dataCy"
    :disable-init-fetch="disableInitFetch"
  />
</template>
