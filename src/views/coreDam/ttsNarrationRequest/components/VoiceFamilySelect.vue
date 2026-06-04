<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AFormRemoteAutocomplete, type IntegerIdNullable } from '@anzusystems/common-admin'
import { useVoiceFamilySlugSelectActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyFilter } from '@/model/coreDam/filter/VoiceFamilyFilter'

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
const innerFilter = useVoiceFamilyFilter()

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
    :inner-filter="innerFilter"
    :clearable="allowNull"
    :disabled="disabledComputed"
    :disable-init-fetch="extSystemId === null"
    filter-by-field="displayName"
    min-search-text="coreDam.voiceFamily.filterMinChars"
    :data-cy="dataCy"
  />
</template>
