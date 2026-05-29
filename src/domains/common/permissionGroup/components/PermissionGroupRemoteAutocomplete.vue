<script lang="ts" setup>
import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupFilter } from '@/domains/common/permissionGroup/filter/PermissionGroupFilter'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | string[] | number[] | null
    client: () => AxiosInstance
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
    dataCy: 'permissionGroup-select',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | number | string[] | number[] | null): void
}>()

const modelValueComputed = computed<number | number[] | null>({
  get() {
    return props.modelValue as number | number[] | null
  },
  set(newValue) {
    emit('update:modelValue', cloneDeep<number | number[] | null>(newValue))
  },
})

const prefetch = computed<'mounted' | false>(() => (props.disableInitFetch ? false : 'mounted'))

const { fetchPermissionGroupOptions, fetchPermissionGroupOptionsByIds } = usePermissionGroupActions()

const { filterData, filterConfig } = usePermissionGroupFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValueComputed"
    :required="required"
    :label="label"
    :fetch-items="fetchPermissionGroupOptions"
    :fetch-items-by-ids="fetchPermissionGroupOptionsByIds"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="title"
    :data-cy="dataCy"
    chips
    hide-details
    :prefetch="prefetch"
  />
</template>
