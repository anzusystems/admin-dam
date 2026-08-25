<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ADialogToolbar } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { useTtsNarrationRequestCancelRequestActions } from '@/domains/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'

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
const { cancelRequestButtonLoading, cancelRequest } = useTtsNarrationRequestCancelRequestActions()

const close = () => {
  emit('update:modelValue', false)
}

const onConfirm = async () => {
  if (!props.requestId) return
  const res = await cancelRequest(props.requestId)
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
        {{ t('coreDam.ttsNarrationRequest.cancelRequest.title') }}
      </ADialogToolbar>
      <VCardText>
        <p class="mb-3">
          {{ t('coreDam.ttsNarrationRequest.cancelRequest.description') }}
        </p>
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
          {{ t('coreDam.ttsNarrationRequest.button.cancelRequest') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
