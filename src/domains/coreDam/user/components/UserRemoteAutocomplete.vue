<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useUserSelectActions } from '@/domains/coreDam/user/composables/userActions'
import { useUserFilter } from '@/domains/coreDam/user/filter/UserFilter'

const props = withDefaults(
  defineProps<{
    modelValue: IntegerId[]
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
  (e: 'update:modelValue', data: IntegerId[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: IntegerId[]) {
    emit('update:modelValue', cloneDeep(newValue))
  },
})

const { fetchItems, fetchItemsByIds } = useUserSelectActions()

const { filterData, filterConfig } = useUserFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

const prefetch = computed(() => (props.disableInitFetch ? false : 'mounted'))
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
    filter-by-field="email"
    :prefetch="prefetch"
  />
</template>
