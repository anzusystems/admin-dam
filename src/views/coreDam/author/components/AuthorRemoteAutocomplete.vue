<script lang="ts" setup>
import type { IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { AFormRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAuthorSelectActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorFilter } from '@/model/coreDam/filter/AuthorFilter'

const props = withDefaults(
  defineProps<{
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    disabled?: boolean
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    disabled: false,
  }
)

const modelValue = defineModel<IntegerIdNullable | IntegerId[]>({ required: true })

const { fetchItems, fetchItemsByIds } = useAuthorSelectActions()

const innerFilter = useAuthorFilter()

const { t } = useI18n()
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
