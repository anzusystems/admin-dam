<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useAssetLicenceGroupSelectActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import { useAssetLicenceGroupInnerFilter } from '@/domains/coreDam/assetLicenceGroup/filter/AssetLicenceGroupFilter'

const props = withDefaults(
  defineProps<{
    extSystemId: IntegerIdNullable
    label?: string | undefined
    dataCy?: string
  }>(),
  {
    label: undefined,
    dataCy: '',
  }
)

const modelValue = defineModel<IntegerId[]>({ required: true })

const { fetchItems, fetchItemsByIds } = useAssetLicenceGroupSelectActions()

const { filterData, filterConfig } = useAssetLicenceGroupInnerFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

watch(
  () => props.extSystemId,
  (extSystemId) => {
    filterData.extSystem = extSystemId
  },
  { immediate: true }
)
</script>

<template>
  <AFormRemoteAutocomplete
    :key="extSystemId + ''"
    v-model="modelValue"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :disabled="!extSystemId"
    multiple
    clearable
    filter-by-field="name"
    prefetch="hover"
    :data-cy="dataCy"
  />
</template>
