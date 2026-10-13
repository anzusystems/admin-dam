import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { cloneDeep, useAlerts, usePagination } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { fetchAssetSlotList, updateAssetSlots } from '@/domains/coreDam/asset/api/assetSlotApi'
import {
  makeMainFile as apiMakeMainFile,
  deleteFile,
  existingFileToSlot,
  unsetAssetSlot,
} from '@/domains/coreDam/asset/api/fileApi'
import { useAssetFileChanged } from '@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange'
import { useAssetSlotFilter } from '@/domains/coreDam/asset/filter/AssetSlotFilter'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetSlotsStore } from '@/domains/coreDam/asset/store/assetSlotsStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'

export function useAssetDetailSidebarSlotsActions(assetId: DocId, assetType: DamAssetTypeType) {
  const assetSlotsStore = useAssetSlotsStore()
  const assetDetailStore = useAssetDetailStore()
  const fileChanged = useAssetFileChanged()
  const { showErrorsDefault, showUnknownError } = useAlerts()

  const { pagination } = usePagination(null)
  const { filterConfig, filterData } = useAssetSlotFilter()

  const showPagination = computed(
    () => !(pagination.value.page === 1 && pagination.value.currentViewCount < pagination.value.rowsPerPage)
  )

  const getList = async () => {
    assetSlotsStore.showLoader()
    // Without the finally a failed fetch leaves the slot panel spinning with nothing to say, and
    // every mutation below ends in this read, or leaves it to the tab that is drawn again.
    try {
      const items = await fetchAssetSlotList(assetId, pagination, filterData, filterConfig)
      assetSlotsStore.setList(items)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      assetSlotsStore.hideLoader()
    }
  }

  /* The read of the slots after a change the page that draws the detail was told of just before. With nothing typed
   * the page reads the asset whole, and the detail is behind its loader from that moment: the tab goes with it, and
   * reads the slots as it is mounted again - after a whole read that failed as well, wherever the detail is drawn
   * again. A read from here too would be a second one, and the answer of the first would take the loader of the
   * slots down under the second. */
  const getListAfterChange = async () => {
    if (assetDetailStore.loader) return
    await getList()
  }

  /* The four changes of a slot below go one at a time: the loader that goes up with a change takes the rows away,
   * with their menus and their dialogs, but only once the tab is drawn again - pressed a second time before that, the
   * change would be sent again, and refused over the one that went through. Each says when it failed: all but the
   * delete of an image reject with what axios threw, or with nothing at all, and neither is an error the alerts
   * know. */
  const removeAssetFile = async (fileId: DocId) => {
    if (assetSlotsStore.loader) return
    // Once the main file of the asset is deleted, the server makes another of its files the main one, or none.
    const ofMainFile = assetSlotsStore.list.some((slot) => slot.main && slot.assetFile?.id === fileId)
    try {
      assetSlotsStore.showLoader()
      await deleteFile(assetType, fileId)
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
      getList()

      return
    }
    if (ofMainFile) fileChanged(assetId)
    getListAfterChange()
  }

  const makeMainFile = async (fileId: DocId) => {
    if (assetSlotsStore.loader) return
    try {
      assetSlotsStore.showLoader()
      await apiMakeMainFile(assetType, fileId, assetId)
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
      getList()

      return
    }
    // The Info tab of the detail shows the main file of the asset, and that is another one now.
    fileChanged(assetId)
    getListAfterChange()
  }

  const unsetSlot = async (data: { fileId: DocId; slotName: string }) => {
    if (assetSlotsStore.loader) return
    try {
      assetSlotsStore.showLoader()
      await unsetAssetSlot(assetType, data.fileId, assetId, data.slotName)
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
    } finally {
      getList()
    }
  }

  const duplicateSlot = async (data: { fileId: DocId; targetSlotName: string }) => {
    if (assetSlotsStore.loader) return
    try {
      assetSlotsStore.showLoader()
      await existingFileToSlot(assetType, data.fileId, assetId, data.targetSlotName)
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
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
    getListAfterChange,
    pagination,
    showPagination,
    unsetSlot,
    removeAssetFile,
    makeMainFile,
    duplicateSlot,
    switchSlot,
  }
}
