<script lang="ts" setup>
import {
  AFilterBooleanSelect,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useDamAuthorType } from '@anzusystems/common-admin'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useAuthorListActions()

const { authorTypeOptions } = useDamAuthorType()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #item.type>
      <AFilterValueObjectOptionsSelect
        name="type"
        :items="authorTypeOptions"
      />
    </template>
    <template #item.reviewed>
      <AFilterBooleanSelect name="reviewed" />
    </template>
  </AFilterWrapper>
</template>
