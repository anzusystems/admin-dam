<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import type { DocIdNullable, IntegerId } from '@anzusystems/common-admin'
import { useVoiceFamilySelectActions } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyFilter } from '@/domains/coreDam/voiceFamily/filter/VoiceFamilyFilter'

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

const { filterData, filterConfig } = useVoiceFamilyFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :clearable="clearable"
    filter-by-field="displayName"
    min-search-text="coreDam.voiceFamily.filterMinChars"
    :data-cy="dataCy"
  />
</template>
