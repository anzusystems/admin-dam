<script lang="ts" setup>
import { onMounted } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DocId } from '@/types/common'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useAssetSlotsStore } from '@/stores/dam/assetSlotsStore'
import { fetchAssetSlotList, updateAssetSlots } from '@/services/api/dam/assetSlotApi'
import { useAssetSlotListFilter } from '@/model/dam/filter/AssetSlotFilter'
import AssetSlotListItem from '@/views/dam/asset/detail/components/slots/AssetSlotListItem.vue'
import {
  deleteFile,
  unsetAssetSlot,
  makeMainFile as apiMakeMainFile,
  existingFileToSlot,
} from '@/services/api/dam/fileApi'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
    assetId: DocId
  }>(),
  {}
)

const assetSlotsStore = useAssetSlotsStore()
const pagination = usePagination()
const filter = useAssetSlotListFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const getList = async () => {
  assetSlotsStore.showLoader()
  const items = await fetchAssetSlotList(props.assetId, pagination, filter)
  assetSlotsStore.setList(items)
  assetSlotsStore.hideLoader()
}

const removeAssetFile = async (fileId: DocId) => {
  // todo
  await deleteFile(props.assetType, fileId)
}

const makeMainFile = async (fileId: DocId) => {
  // todo
  await apiMakeMainFile(props.assetType, fileId, props.assetId)
}

const unsetSlot = async (data: { fileId: DocId; slotName: string }) => {
  // todo
  await unsetAssetSlot(props.assetType, data.fileId, props.assetId, data.slotName)
}

const duplicateSlot = async (data: { fileId: DocId; slotName: string }) => {
  // todo
  await existingFileToSlot(props.assetType, data.fileId, props.assetId, data.slotName)
}

const switchSlot = async (data: { sourceSlotName: string; targetSlotName: string }) => {
  // todo
  const sourceSlotNameCache = data.sourceSlotName
  const targetSlotNameCache = data.targetSlotName

  if (
    assetSlotsStore.getPositionedSlots[sourceSlotNameCache] === null &&
    assetSlotsStore.getPositionedSlots[targetSlotNameCache] === null
  ) {
    return
  } else if (
    assetSlotsStore.getPositionedSlots[sourceSlotNameCache] === null &&
    assetSlotsStore.getPositionedSlots[targetSlotNameCache]?.assetFile?.id
  ) {
    await existingFileToSlot(
      props.assetType,
      assetSlotsStore.getPositionedSlots[targetSlotNameCache]!.assetFile!.id,
      props.assetId,
      sourceSlotNameCache
    )
    await unsetAssetSlot(
      props.assetType,
      assetSlotsStore.getPositionedSlots[targetSlotNameCache]!.assetFile!.id,
      props.assetId,
      targetSlotNameCache
    )
    return
  } else if (
    assetSlotsStore.getPositionedSlots[targetSlotNameCache] === null &&
    assetSlotsStore.getPositionedSlots[sourceSlotNameCache]?.assetFile?.id
  ) {
    await existingFileToSlot(
      props.assetType,
      assetSlotsStore.getPositionedSlots[sourceSlotNameCache]!.assetFile!.id,
      props.assetId,
      targetSlotNameCache
    )
    await unsetAssetSlot(
      props.assetType,
      assetSlotsStore.getPositionedSlots[sourceSlotNameCache]!.assetFile!.id,
      props.assetId,
      sourceSlotNameCache
    )
    return
  }

  const prepareData: Array<{ assetFile: DocId; slotName: string }> = []
  for (const [key, value] of Object.entries(assetSlotsStore.getPositionedSlots)) {
    if (value && value.assetFile) {
      prepareData.push({ assetFile: value.assetFile.id, slotName: key })
    }
  }

  for (let i = 0; i < prepareData.length; i++) {
    if (prepareData[i].slotName === sourceSlotNameCache) prepareData[i].slotName = targetSlotNameCache
    else if (prepareData[i].slotName === targetSlotNameCache) prepareData[i].slotName = sourceSlotNameCache
  }
  await updateAssetSlots(props.assetId, prepareData)
}

onMounted(async () => {
  assetSlotsStore.setAssetSlotsNamesFromConfig(props.assetType)
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive"></AssetDetailSidebarActionsWrapper>
  <div v-if="assetSlotsStore.loader" class="d-flex w-100 h-100 justify-center align-center pa-2">
    <VProgressCircular indeterminate color="primary"></VProgressCircular>
  </div>
  <div v-else-if="assetSlotsStore.list.length === 0" class="pa-4 text-caption">Nothing to show</div>
  <div v-else>
    <AssetSlotListItem
      v-for="(slot, slotName) in assetSlotsStore.getPositionedSlots"
      :key="slotName"
      :item="slot"
      :slot-name="slotName"
      :asset-type="assetType"
      :total-slot-count="assetSlotsStore.assetSlotNames.length"
      @unset-slot="unsetSlot"
      @remove-file="removeAssetFile"
      @make-main-file="makeMainFile"
      @duplicate-slot="duplicateSlot"
      @switch-slot="switchSlot"
    />
    <ADatatablePagination v-if="showPagination" hide-records-per-page v-model="pagination" @change="getList" />
  </div>
</template>
