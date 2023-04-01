<script lang="ts" setup>
import { ref } from 'vue'
import { ADialogToolbar, eventClickBlur } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    dialogMaxWidth?: number
    variant?: 'normal' | 'small'
    dataCy?: string
  }>(),
  {
    dialogMaxWidth: 300,
    variant: 'normal',
    dataCy: 'button-clear',
  }
)
const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const dialog = ref(false)

const onClick = (event: Event) => {
  eventClickBlur(event)
  dialog.value = true
}
const onConfirm = () => {
  emit('confirm')
  dialog.value = false
}

const onCancel = () => {
  dialog.value = false
}

const { t } = useI18n()
</script>

<template>
  <div class="d-inline-flex">
    <VBtn
      v-if="variant === 'small'"
      variant="text"
      :height="26"
      class="mr-2"
      :data-cy="dataCy"
      @click.stop="onClick"
    >
      {{ t('coreDam.asset.selected.clear') }}
    </VBtn>
    <VBtn
      v-else-if="variant === 'normal'"
      :height="36"
      :width="36"
      variant="text"
      icon
      @click.stop="onClick"
    >
      <VIcon icon="mdi-close" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('coreDam.asset.selected.cancel') }}
      </VTooltip>
    </VBtn>
    <VDialog
      v-model="dialog"
      :width="500"
    >
      <VCard
        v-if="dialog"
        data-cy="delete-panel"
      >
        <ADialogToolbar @on-cancel="onCancel">
          {{ t('coreDam.asset.selected.clearOverlay.title') }}
        </ADialogToolbar>
        <VCardText>
          {{ t('coreDam.asset.selected.clearOverlay.description') }}
        </VCardText>
        <VCardActions>
          <VSpacer />
          <ABtnTertiary
            data-cy="button-cancel"
            @click.stop="onCancel"
          >
            {{ t('common.button.cancel') }}
          </ABtnTertiary>
          <ABtnPrimary
            data-cy="button-confirm"
            @click.stop="onConfirm"
          >
            {{ t('coreDam.asset.selected.clearOverlay.confirm') }}
          </ABtnPrimary>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
