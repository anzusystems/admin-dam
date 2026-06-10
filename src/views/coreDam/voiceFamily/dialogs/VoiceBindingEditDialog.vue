<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, cloneDeep } from '@anzusystems/common-admin'
import type { Voice } from '@/types/coreDam/Voice'
import { useVoiceEditActions } from '@/views/coreDam/voiceFamily/composables/voiceActions'
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
const { saveButtonLoading, onUpdate } = useVoiceEditActions()

const localVoice = ref<Voice | null>(null)

// Re-clone whenever the dialog opens (and when the bound voice changes) — reopening the SAME row
// keeps the same props.voice reference, so a watch on props.voice alone would not fire and stale
// (cancelled) edits would linger in localVoice.
watch(
  [() => props.modelValue, () => props.voice],
  ([open, newVoice]) => {
    if (open && newVoice) {
      localVoice.value = cloneDeep(newVoice)
    }
  },
  { immediate: true },
)

const onCancel = () => {
  emit('update:modelValue', false)
}

const onConfirm = () => {
  if (!localVoice.value) return
  onUpdate(localVoice.value, () => {
    emit('update:modelValue', false)
    emit('onSuccess')
  })
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
        <VoiceManage v-model:voice="localVoice" />
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
