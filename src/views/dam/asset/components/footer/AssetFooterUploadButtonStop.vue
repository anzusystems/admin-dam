<script lang="ts" setup>
import { ref } from 'vue'
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'
import ABtn from '@/components/common/buttons/ABtn.vue'

const props = withDefaults(
  defineProps<{
    isUploading: boolean
    dialogMaxWidth?: number
    buttonSize?: number
    dataCy?: string
  }>(),
  {
    dialogMaxWidth: 300,
    buttonSize: 26,
    dataCy: 'button-stop',
  }
)
const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const dialog = ref(false)

const onClick = (event: Event) => {
  clickBlur(event)
  if (!props.isUploading) {
    emit('confirm')
    return
  }
  dialog.value = true
}
const onConfirm = () => {
  emit('confirm')
  dialog.value = false
}

const onCancel = () => {
  dialog.value = false
}

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VBtn variant="flat" :data-cy="dataCy" @click.stop="onClick" icon :width="buttonSize" :height="buttonSize">
    <VIcon icon="mdi-close" />
    <VTooltip activator="parent" location="bottom">{{ t('common.upload.stop') }}</VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('common.upload.stopConfirmQuestion') }}</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onCancel"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <VCardActions>
        <VSpacer />
        <ABtn color="secondary" text @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </ABtn>
        <ABtn color="error" @click.stop="onConfirm" data-cy="button-confirm">{{ t('common.upload.stop') }}</ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
