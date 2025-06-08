<script lang="ts" setup>
import { AFormRemoteAutocomplete, cloneDeep, type DocIdNullable } from '@anzusystems/common-admin'
import { usePodcastSelectActions } from '@/views/coreDam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/model/coreDam/filter/PodcastFilter'
import { computed } from 'vue'

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

const innerFilter = usePodcastFilter()
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValueComputed"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    :disable-init-fetch="disableInitFetch"
    filter-by-field="title"
    :data-cy="dataCy"
  />
</template>
