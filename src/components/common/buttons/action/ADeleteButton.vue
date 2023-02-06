<script lang="ts" setup>
import { computed, ref } from 'vue'
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
    disableCloseAfterConfirm?: boolean
    loading?: boolean
  }>(),
  {
    variant: 'text',
    useUiHelper: false,
    buttonT: 'common.button.delete',
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
    disableCloseAfterConfirm: false,
  }
)
const emit = defineEmits<{
  (e: 'deleteRecord'): void
}>()

const dialog = ref(false)

const onClick = (event: Event) => {
  clickBlur(event)
  dialog.value = true
}
const onConfirm = () => {
  emit('deleteRecord')
  if (!props.disableCloseAfterConfirm) closeDialog()
}

const closeDialog = () => {
  dialog.value = false
}

const onCancel = () => {
  closeDialog()
}

const { t } = useI18n({ useScope: 'global' })

const { btn } = useUiHelper()

const progress = computed(() => {
  if (props.loading) {
    return props.loading
  }
  if (props.useUiHelper) {
    return btn.delete.loading
  }
  return false
})

defineExpose({
  closeDialog,
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
    :loading="loading"
  >
    <VIcon icon="mdi-trash-can-outline" />
    <VTooltip activator="parent" location="bottom">{{ t(buttonT) }}</VTooltip>
  </ABtn>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t(dialogMessageT) }}</div>
        </div>
        <VSpacer />
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
        <VSpacer />
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
