<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import { AFormRemoteAutocomplete } from '@anzusystems/common-admin'
import { useVideoShowSelectActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import { useVideoShowFilter } from '@/model/coreDam/filter/VideoShowFilter'

const props = withDefaults(
  defineProps<{
    modelValue: string | null | string[] | any
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
  (e: 'update:modelValue', data: string | null | string[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = useVideoShowSelectActions()

const innerFilter = useVideoShowFilter()
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
    filter-by-field="title"
    :data-cy="dataCy"
    :disable-init-fetch="disableInitFetch"
  />
</template>
