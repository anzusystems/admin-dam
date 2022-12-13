<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import { usePermissionGroupFilter } from '@/model/dam/filter/PermissionGroupFilter'
import { usePermissionGroupSelectActions } from '@/views/dam/permissionGroup/composables/permissionGroupActions'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | number[] | any
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

const { fetchItems, fetchItemsByIds } = usePermissionGroupSelectActions()

const innerFilter = usePermissionGroupFilter()
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
    filter-by-field="title"
    :data-cy="dataCy"
  ></ARemoteSelect>
</template>
