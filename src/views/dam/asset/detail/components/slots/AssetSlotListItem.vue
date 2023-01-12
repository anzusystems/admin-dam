<script setup lang="ts">
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AssetSlot } from '@/types/dam/AssetSlot'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import AssetSlotListItemRemove from '@/views/dam/asset/detail/components/slots/AssetSlotListItemRemove.vue'
import AssetSlotListItemDuplicate from '@/views/dam/asset/detail/components/slots/AssetSlotListItemDuplicate.vue'
import AssetSlotListItemSwitch from '@/views/dam/asset/detail/components/slots/AssetSlotListItemSwitch.vue'
import { DocId } from '@/types/common'

const props = withDefaults(
  defineProps<{
    slotName: string
    item: AssetSlot | null
    assetType: AssetType
    totalSlotCount: number
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'removeFile', fileId: DocId): void
  (e: 'makeMainFile', fileId: DocId): void
  (e: 'unsetSlot', data: { fileId: DocId; slotName: string }): void
  (e: 'duplicateSlot', data: { fileId: DocId; targetSlotName: string }): void
  (e: 'switchSlot', data: { sourceSlotName: string; targetSlotName: string }): void
}>()

const { t } = useI18n({ useScope: 'global' })

const itemHasFile = computed(() => {
  return props.item && props.item.assetFile
})

const fileTitle = computed(() => {
  if (!props.item || !props.item.assetFile) return ''
  return props.item.assetFile.fileAttributes.originFileName
    ? props.item.assetFile.fileAttributes.originFileName
    : props.item.assetFile.id
})

const removeAssetFile = () => {
  if (!props.item || !props.item.assetFile) return
  emit('removeFile', props.item.assetFile.id)
}

const makeMainFile = () => {
  if (!props.item || !props.item.assetFile) return
  emit('makeMainFile', props.item.assetFile.id)
}

const unsetSlot = () => {
  if (!props.item || !props.item.assetFile) return
  emit('unsetSlot', { fileId: props.item.assetFile.id, slotName: props.slotName })
}

const duplicateSlot = (targetName: string) => {
  if (!props.item || !props.item.assetFile) return
  emit('duplicateSlot', { fileId: props.item.assetFile.id, targetSlotName: targetName })
}

const switchSlot = (targetName: string) => {
  emit('switchSlot', { targetSlotName: targetName, sourceSlotName: props.slotName })
}
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">
    <VRow>
      <VCol v-if="itemHasFile">
        <div class="font-weight-bold">
          {{ slotName }} <span v-if="item.main">({{ t('coreDam.asset.slots.mainFile') }})</span>
        </div>
        <div>{{ fileTitle }}</div>
      </VCol>
      <VCol v-else>
        <div class="font-weight-bold">
          {{ slotName }}
        </div>
        <div>{{ t('coreDam.asset.slots.noFile') }}</div>
      </VCol>
      <VCol cols="3" class="text-right">
        <VBtn variant="text" size="small" icon v-if="!itemHasFile">
          <VIcon icon="mdi-plus" />
          <VTooltip activator="parent" location="bottom">Upload file TODO</VTooltip>
        </VBtn>
        <VBtn variant="text" icon size="small" class="mx-1" v-if="itemHasFile">
          <VIcon icon="mdi-dots-horizontal" />
          <VMenu activator="parent">
            <VCard min-width="300">
              <VList>
                <VListItem
                  v-if="totalSlotCount > 1 && !item.main"
                  @click.stop="makeMainFile"
                  :title="t('coreDam.asset.slots.actions.makeMainFile')"
                />
                <AssetSlotListItemDuplicate
                  v-if="totalSlotCount > 1"
                  :item="item"
                  :file-title="fileTitle"
                  @duplicate-slot="duplicateSlot"
                />
                <AssetSlotListItemSwitch
                  v-if="totalSlotCount > 1"
                  :item="item"
                  :file-title="fileTitle"
                  @switch-slot="switchSlot"
                />
                <AssetSlotListItemRemove
                  :item="item"
                  :file-title="fileTitle"
                  @remove-file="removeAssetFile"
                  @unset-slot="unsetSlot"
                />
              </VList>
            </VCard>
          </VMenu>
          <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.slots.actions.slotOptions') }}</VTooltip>
        </VBtn>
      </VCol>
    </VRow>
  </div>
</template>
