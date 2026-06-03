<script lang="ts" setup>
import { AFormRemoteAutocomplete, type DocIdNullable, type IntegerId } from '@anzusystems/common-admin'
import { useVoiceFamilySelectActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyFilter } from '@/model/coreDam/filter/VoiceFamilyFilter'

const props = withDefaults(
  defineProps<{
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

const modelValue = defineModel<DocIdNullable>({ required: true })

const { fetchItems, fetchItemsByIds } = useVoiceFamilySelectActions(() => props.extSystemId)

const innerFilter = useVoiceFamilyFilter()
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValue"
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
