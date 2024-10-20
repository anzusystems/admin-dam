import { useAssetSlotFilter } from '@/model/coreDam/filter/AssetSlotFilter'
import { fetchAssetSlotList, updateAssetSlots } from '@/services/api/coreDam/assetSlotApi'
import {
  makeMainFile as apiMakeMainFile,
  deleteFile,
  existingFileToSlot,
  unsetAssetSlot,
} from '@/services/api/coreDam/fileApi'
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { cloneDeep, useAlerts, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'

export function useAssetDetailSidebarSlotsActions(assetId: DocId, assetType: DamAssetTypeType) {
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
    try {
      assetSlotsStore.showLoader()
      await apiMakeMainFile(assetType, fileId, assetId)
    } catch (e) {
      showErrorsDefault(e)
    } finally {
      getList()
    }
  }

  const unsetSlot = async (data: { fileId: DocId; slotName: string }) => {
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
    const cloned = cloneDeep<Record<string, null | AssetSlot>>(assetSlotsStore.getPositionedSlots)
    {
      ;[cloned[data.sourceSlotName], cloned[data.targetSlotName]] = [
        cloned[data.targetSlotName],
        cloned[data.sourceSlotName],
      ]
    }
    const prepareData: Array<{ assetFile: DocId | null; slotName: string }> = []
    for (const [key, value] of Object.entries(cloned)) {
      prepareData.push({ assetFile: value?.assetFile?.id ?? null, slotName: key })
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
  }
}
