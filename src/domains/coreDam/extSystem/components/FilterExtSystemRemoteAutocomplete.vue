<script lang="ts" setup>
import { AFilterRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useExtSystemFilter } from '@/domains/coreDam/extSystem/filter/ExtSystemFilter'
import { useExtSystemSelectActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'

defineProps<{
  name: string
}>()

const { fetchItems, fetchItemsByIds } = useExtSystemSelectActions()

const { filterData, filterConfig } = useExtSystemFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)
</script>

<template>
  <AFilterRemoteAutocomplete
    :name="name"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    filter-by-field="name"
  />
</template>
