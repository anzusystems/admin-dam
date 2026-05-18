<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, AFormTextField, AFormValueObjectOptionsSelect, ARow, ASystemEntityScope, useAlerts } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/voiceApi'
import { updateVoice } from '@/services/api/coreDam/voiceApi'
import type { Voice, VoiceUpdate } from '@/types/coreDam/Voice'
import { useTtsProvider } from '@/model/coreDam/valueObject/TtsProvider'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    voice: Voice | null
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'onSuccess'): void
}>()

const { t } = useI18n()
const { showRecordWas, showErrorsDefault } = useAlerts()
const { ttsProviderOptions } = useTtsProvider()

const saveButtonLoading = ref(false)
const localVoice = ref<Voice | null>(null)
const metadataRaw = ref('')
const metadataError = ref<string | null>(null)

const parsedMetadata = computed<Record<string, unknown> | null>(() => {
  if (!metadataRaw.value.trim()) return {}
  try {
    const parsed = JSON.parse(metadataRaw.value)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
})

watch(
  () => props.voice,
  (newVoice) => {
    metadataError.value = null
    if (newVoice) {
      localVoice.value = { ...newVoice }
      metadataRaw.value = Object.keys(newVoice.metadata).length > 0 ? JSON.stringify(newVoice.metadata, null, 2) : ''
    }
  },
  { immediate: true }
)

const onMetadataBlur = () => {
  metadataError.value = parsedMetadata.value === null ? t('coreDam.voice.validation.metadataInvalid') : null
}

const onCancel = () => {
  emit('update:modelValue', false)
}

const onConfirm = async () => {
  if (!localVoice.value) return
  if (parsedMetadata.value === null) {
    metadataError.value = t('coreDam.voice.validation.metadataInvalid')
    return
  }

  saveButtonLoading.value = true
  try {
    const payload: VoiceUpdate = {
      externalVoiceId: localVoice.value.externalVoiceId,
      metadata: parsedMetadata.value,
      primary: localVoice.value.primary,
      active: localVoice.value.active,
    }

    await updateVoice(localVoice.value.id, payload)
    showRecordWas('updated')
    emit('update:modelValue', false)
    emit('onSuccess')
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saveButtonLoading.value = false
  }
}

</script>

<template>
  <VDialog
    :model-value="modelValue"
    :width="600"
    scrollable
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <VCard v-if="modelValue && localVoice">
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('coreDam.voice.meta.edit') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="localVoice.provider"
              :label="t('coreDam.voice.model.provider')"
              :items="ttsProviderOptions"
              readonly
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="localVoice.externalVoiceId"
              :label="t('coreDam.voice.model.externalVoiceId')"
              data-cy="voice-external-id"
            />
          </ARow>
          <ARow>
            <VTextarea
              v-model="metadataRaw"
              :label="t('coreDam.voice.model.metadata')"
              :error-messages="metadataError ? [metadataError] : []"
              rows="4"
              data-cy="voice-metadata"
              @blur="onMetadataBlur"
            />
          </ARow>
          <ARow>
            <VSwitch
              v-model="localVoice.primary"
              class="pl-2"
              :label="t('coreDam.voice.model.primary')"
              data-cy="voice-is-primary"
            />
          </ARow>
          <ARow>
            <VSwitch
              v-model="localVoice.active"
              class="pl-2"
              :label="t('coreDam.voice.model.active')"
              data-cy="voice-is-active"
            />
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="saveButtonLoading"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
