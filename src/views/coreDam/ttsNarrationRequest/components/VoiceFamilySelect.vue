<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AFormValueObjectOptionsSelect,
  type IntegerId,
  type IntegerIdNullable,
  usePagination,
  useAlerts,
  type ValueObjectOption,
} from '@anzusystems/common-admin'
import { fetchVoiceFamilyListByExtSystem } from '@/services/api/coreDam/voiceFamilyApi'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'

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
const { showErrorsDefault } = useAlerts()

const loading = ref(false)
const voiceFamilies = ref<VoiceFamily[]>([])
let loadedForExtSystemId: IntegerId | null = null

const loadForExtSystem = async (extSystemId: IntegerId) => {
  if (loadedForExtSystemId === extSystemId) return
  loading.value = true
  try {
    const pagination = usePagination('slug')
    pagination.rowsPerPage = 200
    voiceFamilies.value = await fetchVoiceFamilyListByExtSystem(extSystemId, pagination, {})
    loadedForExtSystemId = extSystemId
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.extSystemId,
  (newValue) => {
    if (newValue === null) {
      voiceFamilies.value = []
      loadedForExtSystemId = null
      return
    }
    loadForExtSystem(newValue)
  },
  { immediate: true }
)

const items = computed<ValueObjectOption<string | null>[]>(() => {
  const result: ValueObjectOption<string | null>[] = []
  if (props.allowNull) {
    result.push({ title: t('coreDam.ttsNarrationRequest.voiceFamilySelect.systemDefault'), value: null })
  }
  voiceFamilies.value.forEach((family) => {
    result.push({ title: `${family.slug} — ${family.displayName}`, value: family.slug })
  })
  return result
})

const disabledComputed = computed(() => props.disabled || props.extSystemId === null)
</script>

<template>
  <AFormValueObjectOptionsSelect
    v-model="modelValue"
    :items="items"
    :label="label ?? t('coreDam.ttsNarrationRequest.model.voiceFamilySlug')"
    :loading="loading"
    :disabled="disabledComputed"
    :data-cy="dataCy"
  />
</template>
