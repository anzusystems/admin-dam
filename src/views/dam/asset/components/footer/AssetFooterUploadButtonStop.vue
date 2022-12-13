<script lang="ts" setup>
import { ref } from 'vue'
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'
import ABtn from '@/components/common/buttons/ABtn.vue'

withDefaults(
  defineProps<{
    dialogMaxWidth?: number
    dataCy?: string
  }>(),
  {
    dialogMaxWidth: 300,
    dataCy: 'button-stop',
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
    <VBtn variant="text" class="ml-1" :data-cy="dataCy" @click.stop="onClick" icon :width="24" :height="24">
      <VIcon icon="mdi-stop" :size="16" />
    </VBtn>
    <VDialog v-model="dialog" persistent :width="500" no-click-animation>
      <VCard v-if="dialog" data-cy="delete-panel">
        <VToolbar class="pl-2" density="compact">
          <div class="d-block pl-0 w-100">
            <div class="text-h6">Are you sure you want to stop upload?</div>
          </div>
          <VSpacer></VSpacer>
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
        <div class="pa-2">todo</div>
        <VCardActions>
          <VSpacer></VSpacer>
          <ABtn color="secondary" text @click.stop="onCancel" data-cy="button-cancel">
            {{ t('common.button.cancel') }}
          </ABtn>
          <ABtn color="error" @click.stop="onConfirm" data-cy="button-confirm">Stop upload</ABtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
