<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import ARemoteSelect from '@/components/form/ARemoteSelect.vue'
import { usePodcastSelectActions } from '@/views/dam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/model/dam/filter/PodcastFilter'

const props = withDefaults(
  defineProps<{
    modelValue: string | null | string[] | any
    label?: string | null
    required?: boolean | null
    multiple?: boolean
    clearable?: boolean
    dataCy?: string
  }>(),
  {
    label: null,
    required: null,
    multiple: false,
    clearable: false,
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | null | string[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = usePodcastSelectActions()

const innerFilter = usePodcastFilter()
</script>

<template>
  <ARemoteSelect
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="title"
    :data-cy="dataCy"
  />
</template>
