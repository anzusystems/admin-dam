<script lang="ts" setup>
import { AFormRemoteAutocomplete, type DocId, type DocIdNullable, type IntegerIdNullable } from '@anzusystems/common-admin'
import { usePodcastSelectActions } from '@/views/coreDam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/model/coreDam/filter/PodcastFilter'

const props = withDefaults(
  defineProps<{
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    disabled?: boolean
    disableInitFetch?: boolean
    extSystemId?: IntegerIdNullable
    dataCy?: string
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    clearable: false,
    disabled: false,
    disableInitFetch: false,
    extSystemId: undefined,
    dataCy: '',
  }
)

const modelValue = defineModel<DocIdNullable | DocId[]>({ required: true })

// Scope to an explicitly passed ext-system (synthesize); otherwise the composable falls back to current.
const { fetchItems, fetchItemsByIds } = usePodcastSelectActions(() => props.extSystemId)

const innerFilter = usePodcastFilter()
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    :disabled="disabled"
    :disable-init-fetch="disableInitFetch"
    filter-by-field="title"
    min-search-text="coreDam.podcast.filterMinChars"
    :data-cy="dataCy"
  />
</template>
