<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import type { Filter } from '@anzusystems/common-admin'
import { AFilterRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAuthorSelectActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorListFilter } from '@/model/coreDam/filter/AuthorFilter'

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
const { fetchItems, fetchItemsByIds } = useAuthorSelectActions()

const innerFilter = useAuthorListFilter()
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
