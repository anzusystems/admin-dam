<script lang="ts" setup>
import { AFilterRemoteAutocomplete, type Filter } from '@anzusystems/common-admin'
import { useExtSystemFilter } from '@/domains/coreDam/extSystem/filter/ExtSystemFilter'
import { useExtSystemSelectActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import { damClient } from '@/shared/apiClients/damClient'

const modelValue = defineModel<Filter>({ required: true })

const { fetchItems, fetchItemsByIds } = useExtSystemSelectActions(damClient)

const innerFilter = useExtSystemFilter()
</script>

<template>
  <AFilterRemoteAutocomplete
    v-model="modelValue"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    filter-by-field="name"
  />
</template>
