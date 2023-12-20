<script lang="ts" setup>
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { AFormRemoteAutocomplete, cloneDeep } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupFilter } from '@/model/common/filter/PermissionGroupFilter'
import { computed } from 'vue'

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

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: string | number | string[] | number[] | null) {
    emit('update:modelValue', cloneDeep<string | number | string[] | number[] | null>(newValue))
  },
})

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { fetchPermissionGroupOptions, fetchPermissionGroupOptionsByIds } = usePermissionGroupActions(props.client)

const innerFilter = usePermissionGroupFilter()
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValueComputed"
    :required="required"
    :label="label"
    :fetch-items="fetchPermissionGroupOptions"
    :fetch-items-by-ids="fetchPermissionGroupOptionsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="title"
    :data-cy="dataCy"
    chips
    hide-details
    :disable-init-fetch="disableInitFetch"
  />
</template>
