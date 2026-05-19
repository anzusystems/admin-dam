<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, useAlerts } from '@anzusystems/common-admin'
import { updateVoice } from '@/services/api/coreDam/voiceApi'
import type { Voice } from '@/types/coreDam/Voice'
import VoiceManage from '@/views/coreDam/voiceFamily/components/VoiceManage.vue'

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

const saveButtonLoading = ref(false)
const localVoice = ref<Voice | null>(null)

watch(
  () => props.voice,
  (newVoice) => {
    if (newVoice) {
      localVoice.value = { ...newVoice }
    }
  },
  { immediate: true },
)

const onCancel = () => {
  emit('update:modelValue', false)
}

const onConfirm = async () => {
  if (!localVoice.value) return

  saveButtonLoading.value = true
  try {
    await updateVoice(localVoice.value.id, localVoice.value)
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
        <VoiceManage
          :voice="localVoice"
          @update:voice="localVoice = $event"
        />
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
