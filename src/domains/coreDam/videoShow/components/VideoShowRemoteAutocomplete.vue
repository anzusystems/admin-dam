<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useVideoShowSelectActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import { useVideoShowFilter } from '@/domains/coreDam/videoShow/filter/VideoShowFilter'

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
const modelValue = defineModel<DocIdNullable>({ required: true })
const modelValueComputed = computed({
  get() {
    return modelValue.value
  },
  set(newValue: DocIdNullable) {
    modelValue.value = cloneDeep(newValue)
  },
})

const { fetchItems, fetchItemsByIds } = useVideoShowSelectActions()

const { filterData, filterConfig } = useVideoShowFilter()
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
