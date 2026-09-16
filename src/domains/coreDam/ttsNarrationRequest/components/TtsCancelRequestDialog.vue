<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ADialogToolbar } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { useTtsNarrationRequestCancelRequestActions } from '@/domains/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'

const props = withDefaults(
  defineProps<{
    requestId: DocId | null
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'onSuccess'): void
}>()

const modelValue = defineModel<boolean>({ required: true })

const { t } = useI18n()
const { cancelRequestButtonLoading, cancelRequest } = useTtsNarrationRequestCancelRequestActions()

const close = () => {
  modelValue.value = false
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
    @update:model-value="(val) => (modelValue = val)"
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
