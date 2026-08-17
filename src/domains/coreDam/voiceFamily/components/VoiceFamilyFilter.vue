<script lang="ts" setup>
import {
  AFilterBooleanSelect,
  AFilterString,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}
</script>

<template>
  <AFilterWrapper
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #search>
      <AFilterString name="displayName" />
    </template>
    <template #item.id>
      <AFilterString name="id" />
    </template>
    <template #item.language>
      <AFilterString name="language" />
    </template>
    <template #item.active>
      <AFilterBooleanSelect name="active" />
    </template>
  </AFilterWrapper>
</template>
