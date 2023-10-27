<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import type { Filter } from '@anzusystems/common-admin'
import { AFilterRemoteAutocomplete } from '@anzusystems/common-admin'
import { useKeywordSelectActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordListFilter } from '@/model/coreDam/filter/KeywordFilter'

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
const { fetchItems, fetchItemsByIds } = useKeywordSelectActions()

const innerFilter = useKeywordListFilter()
</script>

<template>
  <AFilterRemoteAutocomplete
    v-model="modelValue"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    filter-by-field="text"
  />
</template>
