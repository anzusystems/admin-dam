<script lang="ts" setup>
import {
  AFilterTimeInterval,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useJobStatus } from '@anzusystems/common-admin'
import { useJobListActions } from '@/domains/coreDam/job/composables/jobActions'
import { allowedTimeIntervalValuesSubject } from '@/domains/system/composables/timeInterval'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useJobListActions()

const { jobStatusOptions } = useJobStatus()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #item.status>
      <AFilterValueObjectOptionsSelect
        name="status"
        :items="jobStatusOptions"
      />
    </template>
    <template #item.startedAtFrom>
      <AFilterTimeInterval
        name-from="startedAtFrom"
        name-until="startedAtUntil"
        :allowed="allowedTimeIntervalValuesSubject"
      />
    </template>
  </AFilterWrapper>
</template>
