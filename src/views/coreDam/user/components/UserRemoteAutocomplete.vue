<script lang="ts" setup>
import { AFormRemoteAutocomplete, cloneDeep, type IntegerId } from '@anzusystems/common-admin'
import { useUserSelectActions } from '@/views/coreDam/user/composables/userActions'
import { useUserFilter } from '@/model/coreDam/filter/UserFilter'
import { computed } from 'vue'

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

const innerFilter = useUserFilter()
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
    filter-by-field="email"
    :data-cy="dataCy"
    :disable-init-fetch="disableInitFetch"
  />
</template>
