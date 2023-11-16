<script setup lang="ts">
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import { ADialogToolbar } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    item: AssetSlot | null
    fileTitle: string
    dataCy: string
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'unsetSlot'): void
  (e: 'removeFile'): void
}>()

const { t } = useI18n()

const dialog = ref(false)
const showUnset = ref(false)

const openDialog = () => {
  if (!props.item) return
  const assetSlotsStore = useAssetSlotsStore()
  const sameFiles = assetSlotsStore.list.filter(
    (slot) => props.item?.assetFile?.id && slot.assetFile?.id && slot.assetFile?.id === props.item?.assetFile?.id
  )
  showUnset.value = sameFiles.length > 1
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const onUnset = () => {
  emit('unsetSlot')
  dialog.value = false
}

const onRemove = () => {
  emit('removeFile')
  dialog.value = false
}
</script>

<template>
  <VListItem
    :title="t('coreDam.asset.slots.actions.remove')"
    data-cy="button-slot-remove"
    @click.stop="openDialog"
  />
  <VDialog
    v-model="dialog"
    :width="600"
  >
    <VCard v-if="dialog">
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('common.modal.system.confirmDelete') }}
      </ADialogToolbar>
      <VCardText>
        <div
          v-if="showUnset"
          class="mb-2"
        >
          {{ t('coreDam.asset.slots.remove.descriptionBothOptions') }}
        </div>
        <div
          v-else
          class="mb-2"
        >
          {{ t('coreDam.asset.slots.remove.descriptionOnlyRemove') }}
        </div>
        <div
          v-if="item"
          class="mb-1"
        >
          <div class="font-weight-bold">{{ t('coreDam.asset.slots.name') }}:</div>
          {{ item.slotName }}
        </div>
        <div class="mb-1">
          <div class="font-weight-bold">{{ t('coreDam.asset.slots.file') }}:</div>
          {{ fileTitle }}
        </div>
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
          v-if="showUnset"
          color="warning"
          data-cy="button-unset"
          @click.stop="onUnset"
        >
          {{ t('coreDam.asset.slots.remove.unsetSlot') }}
        </ABtnPrimary>
        <ABtnPrimary
          color="error"
          data-cy="button-remove"
          @click.stop="onRemove"
        >
          {{ t('coreDam.asset.slots.remove.removeFile') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
