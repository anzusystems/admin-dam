<script lang="ts" setup>
import { AFilterString, AFilterWrapper, FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'
import { useExtSystemListActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useExtSystemListActions()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #search>
      <AFilterString name="name" />
    </template>
  </AFilterWrapper>
</template>
