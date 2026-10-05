<script setup lang="ts">
import { ADialogToolbar, DamAssetType } from '@anzusystems/common-admin'
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAssetSlotsStore } from '@/domains/coreDam/asset/store/assetSlotsStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { ACL, assetTypeAcl, useAuth } from '@/domains/system/auth/auth'

const props = withDefaults(
  defineProps<{
    item: AssetSlot | null
    fileTitle: string
    assetType: DamAssetTypeType
    dataCy?: string | undefined
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

const assetSlotsStore = useAssetSlotsStore()
const { can, canForAll } = useAuth()

const usedInSeveralSlots = computed(
  () =>
    assetSlotsStore.list.filter(
      (slot) => props.item?.assetFile?.id && slot.assetFile?.id && slot.assetFile?.id === props.item?.assetFile?.id
    ).length > 1
)
const canUnset = computed(() => canForAll([ACL.DAM_ASSET_UPDATE, assetTypeAcl(props.assetType, 'update')]))
// TODO(BE): core-dam checks dam_document_delete on DELETE /document/{id}, which no voter supports, so it is a 403 even
// for a super admin; hidden for documents until the voter takes it, then gated on dam_document_delete
// (ACL BE task #86852/2.11).
const canRemove = computed(
  () => props.assetType !== DamAssetType.Document && can(assetTypeAcl(props.assetType, 'delete'))
)

const openDialog = () => {
  if (!props.item) return
  showUnset.value = usedInSeveralSlots.value && canUnset.value
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
    v-if="canRemove || (canUnset && usedInSeveralSlots)"
    :title="t('coreDam.asset.slots.actions.remove')"
    data-cy="button-slot-remove"
    @click.stop="openDialog"
  />
  <VDialog
    v-model="dialog"
    :width="600"
  >
    <VCard v-if="dialog">
      <ADialogToolbar @cancel="onCancel">
        {{ t('common.system.modal.confirmDelete') }}
      </ADialogToolbar>
      <VCardText>
        <div
          v-if="showUnset && canRemove"
          class="mb-2"
        >
          {{ t('coreDam.asset.slots.remove.descriptionBothOptions') }}
        </div>
        <div
          v-else-if="showUnset"
          class="mb-2"
        >
          {{ t('coreDam.asset.slots.remove.descriptionOnlyUnset') }}
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
          v-if="canRemove"
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
