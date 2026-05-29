<script lang="ts" setup>
import { AFilterString, AFilterWrapper, FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'
import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = usePermissionGroupActions()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #search>
      <AFilterString name="title" />
    </template>
  </AFilterWrapper>
</template>
