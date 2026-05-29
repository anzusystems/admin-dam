<script lang="ts" setup>
import { AFilterString, AFilterWrapper, FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import PermissionGroupRemoteSelect from '@/domains/common/permissionGroup/components/PermissionGroupRemoteSelect.vue'
import { damClient } from '@/shared/apiClients/damClient'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useAnzuUserActions()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    :client="damClient"
    @submit="emit('submit')"
    @reset="emit('reset')"
    @bookmark-load-after="emit('submit')"
  >
    <template #search>
      <AFilterString name="email" />
    </template>
    <template #item.permissionGroups>
      <PermissionGroupRemoteSelect name="permissionGroups" />
    </template>
  </AFilterWrapper>
</template>
