<script lang="ts" setup>
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAuthorSelectActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorFilter } from '@/model/coreDam/filter/AuthorFilter'
import { computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    disabled?: boolean
    canBeCurrentAuthor?: boolean | null | undefined
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    disabled: false,
    canBeCurrentAuthor: null,
  }
)

const modelValue = defineModel<DocIdNullable | DocId[]>({ required: true })

const { fetchItems, fetchItemsByIds } = useAuthorSelectActions()

const innerFilter = useAuthorFilter()

const canBeCurrentAuthorComputed = computed(() => {
  return props.canBeCurrentAuthor
})

watch(
  canBeCurrentAuthorComputed,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    modelValue.value = null
    if (newValue) {
      innerFilter.canBeCurrentAuthor.model = newValue
      return
    }
    innerFilter.canBeCurrentAuthor.model = null
  },
  { immediate: true }
)
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :filter-sort-by="null"
    filter-by-field="text"
    :multiple="multiple"
    :disabled="props.disabled"
  />
</template>
