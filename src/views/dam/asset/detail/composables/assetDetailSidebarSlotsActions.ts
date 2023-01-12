import { useAssetSlotsStore } from '@/stores/dam/assetSlotsStore'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import { useAssetSlotListFilter } from '@/model/dam/filter/AssetSlotFilter'
import { fetchAssetSlotList, updateAssetSlots } from '@/services/api/dam/assetSlotApi'
import type { DocId } from '@/types/common'
import {
  deleteFile,
  existingFileToSlot,
  makeMainFile as apiMakeMainFile,
  unsetAssetSlot,
} from '@/services/api/dam/fileApi'
import type { AssetType } from '@/model/dam/valueObject/AssetType'

export function useAssetDetailSidebarSlotsActions(assetId: DocId, assetType: AssetType) {
  const assetSlotsStore = useAssetSlotsStore()

  const pagination = usePagination()
  const filter = useAssetSlotListFilter()

  const { showPagination } = usePaginationAutoHide(pagination)

  const getList = async () => {
    assetSlotsStore.showLoader()
    const items = await fetchAssetSlotList(assetId, pagination, filter)
    assetSlotsStore.setList(items)
    assetSlotsStore.hideLoader()
  }

  const removeAssetFile = async (fileId: DocId) => {
    // todo
    try {
      assetSlotsStore.showLoader()
      await deleteFile(assetType, fileId)
    } catch (e) {
      console.error(e)
    } finally {
      getList()
    }
  }

  const makeMainFile = async (fileId: DocId) => {
    // todo
    try {
      assetSlotsStore.showLoader()
      await apiMakeMainFile(assetType, fileId, assetId)
    } catch (e) {
      console.error(e)
    } finally {
      getList()
    }
  }

  const unsetSlot = async (data: { fileId: DocId; slotName: string }) => {
    // todo
    try {
      assetSlotsStore.showLoader()
      await unsetAssetSlot(assetType, data.fileId, assetId, data.slotName)
    } catch (e) {
      console.error(e)
    } finally {
      getList()
    }
  }

  const duplicateSlot = async (data: { fileId: DocId; targetSlotName: string }) => {
    // todo
    try {
      assetSlotsStore.showLoader()
      await existingFileToSlot(assetType, data.fileId, assetId, data.targetSlotName)
    } catch (e) {
      console.error(e)
    } finally {
      getList()
    }
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
      try {
        await existingFileToSlot(
          assetType,
          assetSlotsStore.getPositionedSlots[targetSlotNameCache]!.assetFile!.id,
          assetId,
          sourceSlotNameCache
        )
        await unsetAssetSlot(
          assetType,
          assetSlotsStore.getPositionedSlots[targetSlotNameCache]!.assetFile!.id,
          assetId,
          targetSlotNameCache
        )
      } catch (e) {
        console.error(e)
      } finally {
        getList()
      }
      return
    } else if (
      assetSlotsStore.getPositionedSlots[targetSlotNameCache] === null &&
      assetSlotsStore.getPositionedSlots[sourceSlotNameCache]?.assetFile?.id
    ) {
      try {
        await existingFileToSlot(
          assetType,
          assetSlotsStore.getPositionedSlots[sourceSlotNameCache]!.assetFile!.id,
          assetId,
          targetSlotNameCache
        )
        await unsetAssetSlot(
          assetType,
          assetSlotsStore.getPositionedSlots[sourceSlotNameCache]!.assetFile!.id,
          assetId,
          sourceSlotNameCache
        )
      } catch (e) {
        console.error(e)
      } finally {
        getList()
      }
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
    try {
      await updateAssetSlots(assetId, prepareData)
    } catch (e) {
      console.error(e)
    } finally {
      getList()
    }
  }

  return {
    getList,
    pagination,
    showPagination,
    unsetSlot,
    removeAssetFile,
    makeMainFile,
    duplicateSlot,
    switchSlot,
  }
}
