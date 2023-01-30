<script lang="ts" setup>
import { ref } from 'vue'
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'
import ABtn from '@/components/common/buttons/ABtn.vue'

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
  clickBlur(event)
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
  <div class="d-inline-flex">
    <VBtn
      v-if="variant === 'small'"
      dark
      variant="flat"
      :height="26"
      class="mr-2"
      color="secondary"
      :data-cy="dataCy"
      @click.stop="onClick"
    >
      {{ t('coreDam.asset.selected.clear') }}
    </VBtn>
    <VBtn
      v-else-if="variant === 'normal'"
      @click.stop="onClick"
      color="secondary"
      :height="36"
      variant="flat"
      rounded="pill"
    >
      {{ t('coreDam.asset.selected.cancel') }}
    </VBtn>
    <VDialog v-model="dialog" persistent :width="500" no-click-animation>
      <VCard v-if="dialog" data-cy="delete-panel">
        <VToolbar class="pl-2" density="compact">
          <div class="d-block pl-0 w-100">
            <div class="text-h6">{{ t('coreDam.asset.selected.clearOverlay.title') }}</div>
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
        <div class="pa-2">{{ t('coreDam.asset.selected.clearOverlay.description') }}</div>
        <VCardActions>
          <VSpacer />
          <ABtn color="secondary" text @click.stop="onCancel" data-cy="button-cancel">
            {{ t('common.button.cancel') }}
          </ABtn>
          <ABtn color="warning" @click.stop="onConfirm" data-cy="button-confirm">
            {{ t('coreDam.asset.selected.clearOverlay.confirm') }}
          </ABtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
