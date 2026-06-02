<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, AFormTextarea, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'
import { useTtsNarrationRequestCancelRequestActions } from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'

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
        {{ t('coreDam.ttsNarrationRequest.cancelRequest.title') }}
      </ADialogToolbar>
      <VCardText>
        <p class="mb-3">
          {{ t('coreDam.ttsNarrationRequest.cancelRequest.description') }}
        </p>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormTextarea
              v-model="reason"
              :label="t('coreDam.ttsNarrationRequest.cancelRequest.reason')"
              :rows="3"
              data-cy="cancel-request-reason"
            />
          </ARow>
        </ASystemEntityScope>
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
