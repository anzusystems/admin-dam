<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { usePodcastSelectActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/domains/coreDam/podcast/filter/PodcastFilter'

const props = withDefaults(
  defineProps<{
    modelValue: DocIdNullable
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
const emit = defineEmits<{
  (e: 'update:modelValue', data: DocIdNullable): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: DocIdNullable) {
    emit('update:modelValue', cloneDeep(newValue))
  },
})

const { fetchItems, fetchItemsByIds } = usePodcastSelectActions()

const { filterData, filterConfig } = usePodcastFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValueComputed"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="title"
    :data-cy="dataCy"
    :prefetch="disableInitFetch ? false : 'hover'"
  />
</template>
