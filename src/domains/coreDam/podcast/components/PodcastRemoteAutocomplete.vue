<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { usePodcastSelectActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/domains/coreDam/podcast/filter/PodcastFilter'

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

const { filterData, filterConfig } = usePodcastFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :multiple="multiple"
    :clearable="clearable"
    :disabled="disabled"
    filter-by-field="title"
    min-search-text="coreDam.podcast.filterMinChars"
    :data-cy="dataCy"
    :prefetch="disableInitFetch ? false : 'hover'"
  />
</template>
