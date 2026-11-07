<script lang="ts" setup>
import { AFilterString, AFilterWrapper, FilterConfigKey, FilterDataKey, isUndefined } from '@anzusystems/common-admin'
import { inject } from 'vue'

import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'

const emit = defineEmits<{ submit: []; reset: [] }>()

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
