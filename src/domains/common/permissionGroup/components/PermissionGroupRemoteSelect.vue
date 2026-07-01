<script lang="ts" setup>
import { AFilterRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { usePermissionGroupSelectAction } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import { usePermissionGroupFilter } from '@/domains/common/permissionGroup/filter/PermissionGroupFilter'

withDefaults(
  defineProps<{
    name: string
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'change'): void
}>()

const { fetchItems, fetchItemsByIds } = usePermissionGroupSelectAction()

const { filterData, filterConfig } = usePermissionGroupFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)
</script>

<template>
  <AFilterRemoteAutocomplete
    :name="name"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    filter-by-field="title"
    @change="emit('change')"
  />
</template>
