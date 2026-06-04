<script lang="ts" setup>
import { AFormRemoteAutocomplete, type DocId, type DocIdNullable } from '@anzusystems/common-admin'
import { usePodcastSelectActions } from '@/views/coreDam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/model/coreDam/filter/PodcastFilter'

withDefaults(
  defineProps<{
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    disableInitFetch?: boolean
    dataCy?: string
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    clearable: false,
    disableInitFetch: false,
    dataCy: '',
  }
)

const modelValue = defineModel<DocIdNullable | DocId[]>({ required: true })

const { fetchItems, fetchItemsByIds } = usePodcastSelectActions()

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
    :disable-init-fetch="disableInitFetch"
    filter-by-field="title"
    min-search-text="coreDam.podcast.filterMinChars"
    :data-cy="dataCy"
  />
</template>
