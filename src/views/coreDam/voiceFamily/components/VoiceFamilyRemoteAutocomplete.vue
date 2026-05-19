<script lang="ts" setup>
import { AFormRemoteAutocomplete, cloneDeep, type DocIdNullable, type IntegerId } from '@anzusystems/common-admin'
import { useVoiceFamilySelectActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyFilter } from '@/model/coreDam/filter/VoiceFamilyFilter'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: DocIdNullable
    extSystemId: IntegerId
    label?: string | undefined
    required?: boolean | undefined
    clearable?: boolean
    dataCy?: string
  }>(),
  {
    label: undefined,
    required: undefined,
    clearable: false,
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

const { fetchItems, fetchItemsByIds } = useVoiceFamilySelectActions(() => props.extSystemId)

const innerFilter = useVoiceFamilyFilter()
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValueComputed"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :clearable="clearable"
    filter-by-field="displayName"
    :data-cy="dataCy"
  />
</template>
