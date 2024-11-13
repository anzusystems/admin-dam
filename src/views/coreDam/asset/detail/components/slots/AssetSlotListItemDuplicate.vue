<script setup lang="ts">
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { ADialogToolbar } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    item: AssetSlot | null
    fileTitle: string
    dataCy?: string | undefined
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'duplicateSlot', targetName: string): void
}>()

const { t } = useI18n()

const dialog = ref(false)
const targetSlot = ref<string | null>(null)
const assetSlotsStore = useAssetSlotsStore()

const targetOptions = computed(() => {
  const emptyNames: string[] = []
  for (const [key, value] of Object.entries(assetSlotsStore.getPositionedSlots)) {
    if (value === null) {
      emptyNames.push(key)
    }
  }
  return emptyNames
})

const openDialog = () => {
  targetSlot.value = null
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const onDuplicate = () => {
  if (!props.item || !targetSlot.value) return
  emit('duplicateSlot', targetSlot.value)
  dialog.value = false
}
</script>

<template>
  <VListItem
    :title="t('coreDam.asset.slots.actions.duplicate')"
    data-cy="button-slot-duplicate"
    @click.stop="openDialog"
  />
  <VDialog
    v-model="dialog"
    :width="600"
  >
    <VCard v-if="dialog">
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('coreDam.asset.slots.actions.duplicate') }}
      </ADialogToolbar>
      <VCardText>
        <div class="mb-1">
          <div class="font-weight-bold">
            {{ t('coreDam.asset.slots.name') }}:
          </div>
          {{ item?.slotName }}
        </div>
        <div class="mb-1">
          <div class="font-weight-bold">
            {{ t('coreDam.asset.slots.file') }}:
          </div>
          {{ fileTitle }}
        </div>
        <div
          v-if="targetOptions.length === 0"
          class="my-2 text-warning"
        >
          {{ t('coreDam.asset.slots.duplicate.onlyToEmptyWarning') }}
        </div>
        <div
          v-else
          class="my-2"
        >
          <VSelect
            v-model="targetSlot"
            data-cy="button-choose-slot"
            :label="t('coreDam.asset.slots.duplicate.to')"
            :items="targetOptions"
          />
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
          data-cy="button-unset"
          :disabled="targetOptions.length === 0 || targetSlot === null"
          @click.stop="onDuplicate"
        >
          {{ t('coreDam.asset.slots.actions.duplicate') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
