<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import type { Filter } from '@anzusystems/common-admin'
import { AFilterRemoteAutocomplete } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import { usePermissionGroupSelectAction } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import { usePermissionGroupFilter } from '@/domains/common/permissionGroup/filter/PermissionGroupFilter'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: Filter): void
}>()
const { modelValue } = useVModels(props, emit)
const { fetchItems, fetchItemsByIds } = usePermissionGroupSelectAction(damClient)

const innerFilter = usePermissionGroupFilter()
</script>

<template>
  <AFilterRemoteAutocomplete
    v-model="modelValue"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    filter-by-field="title"
  />
</template>
