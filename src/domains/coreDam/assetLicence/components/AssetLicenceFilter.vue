<script lang="ts" setup>
import { AFilterString, AFilterWrapper, FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'
import { useAssetLicenceListActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'
import FilterExtSystemRemoteAutocomplete from '@/domains/coreDam/extSystem/components/FilterExtSystemRemoteAutocomplete.vue'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useAssetLicenceListActions()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #search>
      <AFilterString name="extId" />
    </template>
    <template #item.extSystem>
      <FilterExtSystemRemoteAutocomplete name="extSystem" />
    </template>
  </AFilterWrapper>
</template>
