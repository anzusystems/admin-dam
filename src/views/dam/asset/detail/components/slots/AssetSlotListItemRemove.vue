<script setup lang="ts">
import type { AssetSlot } from '@/types/dam/AssetSlot'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useAssetSlotsStore } from '@/stores/dam/assetSlotsStore'

const props = withDefaults(
  defineProps<{
    item: AssetSlot | null
    fileTitle: string
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'unsetSlot'): void
  (e: 'removeFile'): void
}>()

const { t } = useI18n({ useScope: 'global' })

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
  if (!props.item) return
  emit('unsetSlot')
  dialog.value = false
}

const onRemove = () => {
  if (!props.item || !props.item.assetFile) return
  emit('removeFile')
  dialog.value = false
}
</script>

<template>
  <VListItem :title="t('coreDam.asset.slots.actions.remove')" @click.stop="openDialog" />
  <VDialog v-model="dialog" persistent :width="600" no-click-animation>
    <VCard v-if="dialog">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('common.modal.confirmDelete') }}</div>
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
      <VCardText>
        <div v-if="showUnset" class="mb-2">{{ t('coreDam.asset.slots.remove.descriptionBothOptions') }}</div>
        <div v-else class="mb-2">{{ t('coreDam.asset.slots.remove.descriptionOnlyRemove') }}</div>
        <div class="mb-1">
          <div class="font-weight-bold">{{ t('coreDam.asset.slots.name') }}:</div>
          {{ item.slotName }}
        </div>
        <div class="mb-1">
          <div class="font-weight-bold">{{ t('coreDam.asset.slots.file') }}:</div>
          {{ fileTitle }}
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="warning" text @click.stop="onUnset" data-cy="button-unset" v-if="showUnset">
          {{ t('coreDam.asset.slots.remove.unsetSlot') }}
        </VBtn>
        <VBtn color="error" text @click.stop="onRemove" data-cy="button-remove">
          {{ t('coreDam.asset.slots.remove.removeFile') }}
        </VBtn>
        <VBtn color="secondary" text @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
