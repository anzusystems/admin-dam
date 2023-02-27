<script setup lang="ts">
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useAssetSlotsStore } from '@/stores/dam/assetSlotsStore'

const props = withDefaults(
  defineProps<{
    item: AssetSlot | null
    fileTitle: string
  }>(),
  {}
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
  <VListItem :title="t('coreDam.asset.slots.actions.duplicate')" @click.stop="openDialog" />
  <VDialog v-model="dialog" persistent :width="600" no-click-animation>
    <VCard v-if="dialog">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('coreDam.asset.slots.actions.duplicate') }}</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="onCancel"
          />
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <div class="mb-1">
          <div class="font-weight-bold">{{ t('coreDam.asset.slots.name') }}:</div>
          {{ item.slotName }}
        </div>
        <div class="mb-1">
          <div class="font-weight-bold">{{ t('coreDam.asset.slots.file') }}:</div>
          {{ fileTitle }}
        </div>
        <div v-if="targetOptions.length === 0" class="my-2 text-warning">
          {{ t('coreDam.asset.slots.duplicate.onlyToEmptyWarning') }}
        </div>
        <div v-else class="my-2">
          <VSelect v-model="targetSlot" :label="t('coreDam.asset.slots.duplicate.to')" :items="targetOptions" />
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          text
          data-cy="button-unset"
          :disabled="targetOptions.length === 0 || targetSlot === null"
          @click.stop="onDuplicate"
        >
          {{ t('coreDam.asset.slots.actions.duplicate') }}
        </VBtn>
        <VBtn color="secondary" text data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
