<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AFormValueObjectOptionsSelect, useAlerts, type ValueObjectOption } from '@anzusystems/common-admin'
import { useCachedVoiceFamilies } from '@/views/coreDam/voiceFamily/composables/cachedVoiceFamilies'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
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

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const { t } = useI18n()
const { showErrorsDefault } = useAlerts()
const { voiceFamilies, loading, loadVoiceFamilies } = useCachedVoiceFamilies()

onMounted(async () => {
  try {
    await loadVoiceFamilies()
  } catch (error) {
    showErrorsDefault(error)
  }
})

const items = computed<ValueObjectOption<string | null>[]>(() => {
  const result: ValueObjectOption<string | null>[] = []
  if (props.allowNull) {
    result.push({ title: t('coreDam.ttsNarrationRequest.voiceFamilySelect.systemDefault'), value: null })
  }
  voiceFamilies.value.forEach((f) => {
    result.push({ title: `${f.slug} — ${f.displayName}`, value: f.slug })
  })
  return result
})
</script>

<template>
  <AFormValueObjectOptionsSelect
    :model-value="modelValue"
    :items="items"
    :label="label ?? t('coreDam.ttsNarrationRequest.model.voiceFamilySlug')"
    :loading="loading"
    :disabled="disabled"
    :data-cy="dataCy"
    @update:model-value="(val) => emit('update:modelValue', (val as string | null) ?? null)"
  />
</template>
