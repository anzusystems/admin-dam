<script lang="ts" setup>
import { AFilterWrapper, FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'
import { useAssetLicenceGroupListActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useAssetLicenceGroupListActions()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  />
</template>
