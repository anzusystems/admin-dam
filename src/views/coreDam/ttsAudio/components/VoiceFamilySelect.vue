<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlerts } from '@anzusystems/common-admin'
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

const items = computed(() => {
  const result: { title: string; value: string | null }[] = []
  if (props.allowNull) {
    result.push({ title: t('coreDam.ttsAudio.voiceFamilySelect.systemDefault'), value: null })
  }
  voiceFamilies.value.forEach((f) => {
    result.push({ title: `${f.slug} — ${f.displayName}`, value: f.slug })
  })
  return result
})
</script>

<template>
  <VSelect
    :model-value="modelValue"
    :items="items"
    :label="label ?? t('coreDam.ttsAudio.model.voiceFamilySlug')"
    :loading="loading"
    :disabled="disabled"
    :data-cy="dataCy"
    item-title="title"
    item-value="value"
    clearable
    hide-details
    variant="outlined"
    density="compact"
    @update:model-value="(val) => emit('update:modelValue', (val as string | null) ?? null)"
  />
</template>
