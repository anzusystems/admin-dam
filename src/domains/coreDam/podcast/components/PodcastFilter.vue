<script lang="ts" setup>
import {
  AFilterBooleanSelect,
  AFilterString,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { usePodcastListActions } from '@/domains/coreDam/podcast/composables/podcastActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = usePodcastListActions()
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
    <template #item.webPublicExportEnabled>
      <AFilterBooleanSelect name="webPublicExportEnabled" />
    </template>
    <template #item.mobilePublicExportEnabled>
      <AFilterBooleanSelect name="mobilePublicExportEnabled" />
    </template>
  </AFilterWrapper>
</template>
