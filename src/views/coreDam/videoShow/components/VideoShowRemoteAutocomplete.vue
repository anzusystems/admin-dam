<script lang="ts" setup>
import { AFormRemoteAutocomplete, cloneDeep, type DocIdNullable } from '@anzusystems/common-admin'
import { useVideoShowSelectActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import { useVideoShowFilter } from '@/model/coreDam/filter/VideoShowFilter'
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

const { fetchItems, fetchItemsByIds } = useVideoShowSelectActions()

const innerFilter = useVideoShowFilter()
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
    filter-by-field="title"
    :data-cy="dataCy"
    :disable-init-fetch="disableInitFetch"
  />
</template>
