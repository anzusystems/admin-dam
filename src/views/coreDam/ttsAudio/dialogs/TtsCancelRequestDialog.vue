<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, ARow } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { useTtsAudioCancelRequestActions } from '@/views/coreDam/ttsAudio/composables/ttsAudioActions'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    requestId: DocId | null
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'onSuccess'): void
}>()

const { t } = useI18n()
const { cancelRequestButtonLoading, cancelRequest } = useTtsAudioCancelRequestActions()

const reason = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = ''
  }
)

const close = () => {
  emit('update:modelValue', false)
}

const onConfirm = async () => {
  if (!props.requestId) return
  const res = await cancelRequest(props.requestId, { reason: reason.value || null })
  if (res !== null) {
    emit('onSuccess')
    close()
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    :width="500"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <VCard v-if="modelValue && requestId">
      <ADialogToolbar @on-cancel="close">
        {{ t('coreDam.ttsAudio.cancelRequest.title') }}
      </ADialogToolbar>
      <VCardText>
        <p class="mb-3">
          {{ t('coreDam.ttsAudio.cancelRequest.description') }}
        </p>
        <ARow>
          <VTextarea
            v-model="reason"
            :label="t('coreDam.ttsAudio.cancelRequest.reason')"
            rows="3"
            variant="outlined"
            density="compact"
            hide-details
            data-cy="cancel-request-reason"
          />
        </ARow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="close"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          color="error"
          :loading="cancelRequestButtonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('coreDam.ttsAudio.button.cancelRequest') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
