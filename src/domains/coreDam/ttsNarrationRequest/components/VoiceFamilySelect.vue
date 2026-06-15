<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { type IntegerIdNullable } from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useVoiceFamilySlugSelectActions } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyFilter } from '@/domains/coreDam/voiceFamily/filter/VoiceFamilyFilter'

const props = withDefaults(
  defineProps<{
    extSystemId: IntegerIdNullable
    label?: string
    allowNull?: boolean
    disabled?: boolean
    dataCy?: string
  }>(),
  {
    label: undefined,
    allowNull: false,
    disabled: false,
    dataCy: '',
  }
)

const modelValue = defineModel<string | null>({ required: true })

const { t } = useI18n()
const { fetchItems, fetchItemsByIds } = useVoiceFamilySlugSelectActions(() => props.extSystemId ?? 0)
const { filterData, filterConfig } = useVoiceFamilyFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

// Ext-system changed to a different system — the current selection (a slug of the old system) is stale.
watch(
  () => props.extSystemId,
  (newValue, oldValue) => {
    if (oldValue !== undefined && oldValue !== newValue) modelValue.value = null
  }
)

const disabledComputed = computed(() => props.disabled || props.extSystemId === null)
</script>

<template>
  <AFormRemoteAutocomplete
    v-model="modelValue"
    :label="label ?? t('coreDam.ttsNarrationRequest.model.voiceFamilySlug')"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :clearable="allowNull"
    :disabled="disabledComputed"
    :prefetch="extSystemId === null ? false : 'hover'"
    filter-by-field="displayName"
    min-search-text="coreDam.voiceFamily.filterMinChars"
    :data-cy="dataCy"
  />
</template>
