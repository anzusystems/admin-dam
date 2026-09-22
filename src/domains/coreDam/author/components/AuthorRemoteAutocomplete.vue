<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useAuthorSelectActions } from '@/domains/coreDam/author/composables/authorActions'
import { useAuthorInnerFilter } from '@/domains/coreDam/author/filter/AuthorFilter'

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

const { filterData, filterConfig } = useAuthorInnerFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

const canBeCurrentAuthorComputed = computed(() => {
  return props.canBeCurrentAuthor
})

watch(
  canBeCurrentAuthorComputed,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    modelValue.value = null
    if (newValue) {
      filterData.canBeCurrentAuthor = newValue
      return
    }
    filterData.canBeCurrentAuthor = null
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
    filter-by-field="text"
    :multiple="multiple"
    :disabled="props.disabled"
  />
</template>
