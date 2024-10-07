<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import type { Filter } from '@anzusystems/common-admin'
import { AFilterRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAnzuUserFilter } from '@/model/common/filter/AnzuUserFilter'
import { useAnzuUserSelectAction } from '@/views/common/anzuUser/composables/anzuUserActions'
import { damClient } from '@/services/api/clients/damClient'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: Filter): void
}>()
const { modelValue } = useVModels(props, emit)
const { fetchItems, fetchItemsByIds } = useAnzuUserSelectAction(damClient)

const innerFilter = useAnzuUserFilter()
</script>

<template>
  <AFilterRemoteAutocomplete
    v-model="modelValue"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    filter-by-field="lastName"
  />
</template>
