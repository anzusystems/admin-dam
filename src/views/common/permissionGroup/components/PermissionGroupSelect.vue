<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupFilter } from '@/model/common/filter/PermissionGroupFilter'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | string[] | number[] | null
    client: () => AxiosInstance
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
    dataCy: 'permissionGroup-select',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | number | string[] | number[]): void
}>()
const { modelValue } = useVModels(props, emit)
const { fetchPermissionGroupOptions, fetchPermissionGroupOptionsByIds } = usePermissionGroupActions(props.client)

const innerFilter = usePermissionGroupFilter()
</script>

<template>
  <ARemoteSelect
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchPermissionGroupOptions"
    :fetch-items-by-ids="fetchPermissionGroupOptionsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="title"
    :data-cy="dataCy"
    init-fetch
    chips
    closable-chips
    hide-details
  />
</template>
