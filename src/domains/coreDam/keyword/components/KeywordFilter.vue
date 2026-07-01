<script lang="ts" setup>
import {
  AFilterBooleanSelect,
  AFilterString,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useKeywordListActions } from '@/domains/coreDam/keyword/composables/keywordActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useKeywordListActions()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #search>
      <AFilterString name="text" />
    </template>
    <template #item.reviewed>
      <AFilterBooleanSelect name="reviewed" />
    </template>
  </AFilterWrapper>
</template>
