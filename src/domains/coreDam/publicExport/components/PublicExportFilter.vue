<script lang="ts" setup>
import {
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { usePublicExportListActions } from '@/domains/coreDam/publicExport/composables/publicExportActions'
import { useExportTypeTypes } from '@/domains/coreDam/asset/valueObject/ExportType'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = usePublicExportListActions()

const { exportTypeOptions } = useExportTypeTypes()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #search>
      <AFilterString name="slug" />
    </template>
    <template #item.type>
      <AFilterValueObjectOptionsSelect
        name="type"
        :items="exportTypeOptions"
      />
    </template>
  </AFilterWrapper>
</template>
