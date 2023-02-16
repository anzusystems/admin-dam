<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import ARemoteAutocomplete from '@/components/form/ARemoteAutocomplete.vue'
import { useVideoShowSelectActions } from '@/views/dam/videoShow/composables/videoShowActions'
import { useVideoShowFilter } from '@/model/dam/filter/VideoShowFilter'

const props = withDefaults(
  defineProps<{
    modelValue: string | null | string[] | any
    label?: string | null
    required?: boolean | null
    multiple?: boolean
    clearable?: boolean
    disableInitFetch?: boolean
    dataCy?: string
  }>(),
  {
    label: null,
    required: null,
    multiple: false,
    clearable: false,
    disableInitFetch: false,
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | null | string[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = useVideoShowSelectActions()

const innerFilter = useVideoShowFilter()
</script>

<template>
  <ARemoteAutocomplete
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
    :disable-init-fetch="disableInitFetch"
  />
</template>
