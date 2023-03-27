import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import type { DocId } from '@anzusystems/common-admin'
import { useAlerts, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'
import { useAssetSlotFilter } from '@/model/coreDam/filter/AssetSlotFilter'
import { fetchAssetSlotList, updateAssetSlots } from '@/services/api/coreDam/assetSlotApi'
import {
  deleteFile,
  existingFileToSlot,
  makeMainFile as apiMakeMainFile,
  unsetAssetSlot,
} from '@/services/api/coreDam/fileApi'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { makePrivate } from '@/services/api/coreDam/audioApi'

export function useAssetDetailSidebarSlotsActions(assetId: DocId, assetType: AssetType) {
  const assetSlotsStore = useAssetSlotsStore()
  const { showErrorsDefault } = useAlerts()

  const pagination = usePagination()
  const filter = useAssetSlotFilter()

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
      showErrorsDefault(e)
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
      showErrorsDefault(e)
    } finally {
      getList()
    }
  }

  const makeFilePrivate = async (fileId: DocId) => {
    try {
      assetSlotsStore.showLoader()
      await makePrivate(fileId)
    } catch (e) {
      showErrorsDefault(e)
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
      showErrorsDefault(e)
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
      showErrorsDefault(e)
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
        showErrorsDefault(e)
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
        showErrorsDefault(e)
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
      showErrorsDefault(e)
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
    makeFilePrivate,
  }
}
