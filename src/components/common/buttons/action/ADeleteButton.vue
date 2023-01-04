<script lang="ts" setup>
import { computed } from 'vue'
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'
import { useUiHelper } from '@/composables/system/uiHelper'
import ABtn from '@/components/common/buttons/ABtn.vue'

const props = withDefaults(
  defineProps<{
    variant?: string
    useUiHelper?: boolean
    buttonT?: string
    buttonClass?: string
    dialogMessageT?: string
    dialogConfirmButtonT?: string
    dialogCancelButtonT?: string
    dialogConfirmColor?: string
    dialogCancelColor?: string
    dialogZIndex?: number
    dialogMaxWidth?: number
    dataCy?: string
    disabled?: boolean
  }>(),
  {
    variant: 'text',
    useUiHelper: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dialogMessageT: 'common.modal.confirmDelete',
    dialogConfirmButtonT: 'common.button.delete',
    dialogCancelButtonT: 'common.button.cancel',
    dialogConfirmColor: 'error',
    dialogCancelColor: 'secondary',
    dialogZIndex: 200,
    dialogMaxWidth: 300,
    dataCy: 'button-delete',
    disabled: false,
  }
)
const emit = defineEmits<{
  (e: 'deleteRecord'): void
}>()

const { dialog } = useUiHelper()

const onClick = (event: Event) => {
  clickBlur(event)
  dialog.delete = true
}
const onConfirm = () => {
  emit('deleteRecord')
}

const onCancel = () => {
  dialog.delete = false
}

const { t } = useI18n({ useScope: 'global' })

const { btn } = useUiHelper()

const progress = computed(() => {
  if (props.useUiHelper) {
    return btn.delete.loading
  }
  return false
})
</script>

<template>
  <ABtn
    :class="buttonClass"
    :data-cy="dataCy"
    btn-helper="delete"
    icon
    size="small"
    :variant="variant"
    @click.stop="onClick"
    :disabled="disabled"
  >
    <VIcon icon="mdi-trash-can-outline" />
    <VTooltip activator="parent" location="bottom">Remove</VTooltip>
  </ABtn>
  <VDialog v-model="dialog.delete" persistent :width="500" no-click-animation>
    <VCard v-if="dialog.delete" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t(dialogMessageT) }}</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onCancel"
            :disabled="progress"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <VCardActions>
        <VSpacer></VSpacer>
        <ABtn :color="dialogCancelColor" text @click.stop="onCancel" :disabled="progress" data-cy="button-cancel">
          {{ t(dialogCancelButtonT) }}
        </ABtn>
        <ABtn :color="dialogConfirmColor" @click.stop="onConfirm" :loading="progress" data-cy="button-confirm">
          {{ t(dialogConfirmButtonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
