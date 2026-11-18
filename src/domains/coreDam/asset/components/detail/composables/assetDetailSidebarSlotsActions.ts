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

// Assets with a slot change in flight, from any part of a detail. See the changes below.
const changesOnTheirWay = new Set<DocId>()

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

  /*
   * The slot list store is shared by all assets. An answer can arrive after the detail moved to another asset.
   * Written then, this asset's rows would show in the other
   * asset's Slots tab, where row actions act on the wrong asset.
   * So an answer is written only while the detail holds this asset and no newer slot request was made.
   * The list is claimed for this asset at creation, so other assets'
   * rows are never shown. Every part reading the list does this first.
   */
  const detailHoldsAsset = () => assetDetailStore.asset?.id === assetId
  assetSlotsStore.holdListOf(assetId)
  // The loader count this part last raised, for a read or a change.
  let raisedLoader = 0
  const showLoader = () => (raisedLoader = assetSlotsStore.showLoader())

  const getList = async () => {
    /*
     * Nothing is read if the detail holds another asset. Only the loader a
     * change raised is lowered, unless that asset's tab raised it since.
     */
    if (!detailHoldsAsset()) {
      assetSlotsStore.hideLoader(raisedLoader)

      return
    }
    const asked = showLoader()
    const isTaken = () => assetSlotsStore.isAwaited(asked) && detailHoldsAsset()
    // Without the finally, a failed fetch leaves the slot panel spinning.
    // Every mutation below ends in this read, or leaves it to the redrawn tab.
    try {
      const items = await fetchAssetSlotList(assetId, pagination, filterData, filterConfig)
      if (isTaken()) assetSlotsStore.setList(items, assetId)
    } catch (error) {
      if (isTaken()) showErrorsDefault(error)
    } finally {
      // Also after an answer that was not written: nothing else lowers the loader for it.
      assetSlotsStore.hideLoader(asked)
    }
  }

  /*
   * Reads slots after a change the page was just told about.
   * With nothing typed the page rereads the asset and the detail
   * shows its loader. The tab remounts and reads the slots itself.
   * A read here would duplicate it, so the slots loader stays up for the redrawn tab.
   */
  const getListAfterChange = async () => {
    if (assetDetailStore.loader) return
    await getList()
  }

  /*
   * Slot changes go one at a time. A second press while the first is
   * in flight would resend the change, and the server refuses it.
   * The loader removes the rows, with their menus and dialogs, only after the tab
   * re-renders. A slot read can also hide the loader before the change is answered.
   * So a change counts as in flight for its asset until it is
   * answered. Each failure is reported with the server's reason.
   */
  const changeOnItsWay = () => assetSlotsStore.loader || changesOnTheirWay.has(assetId)
  const sendChange = async (request: () => Promise<unknown>) => {
    changesOnTheirWay.add(assetId)
    showLoader()
    try {
      await request()
    } finally {
      changesOnTheirWay.delete(assetId)
    }
  }

  const removeAssetFile = async (fileId: DocId) => {
    if (changeOnItsWay()) return
    // When the main file is deleted, the server makes another file the main one, or none.
    const ofMainFile = assetSlotsStore.list.some((slot) => slot.main && slot.assetFile?.id === fileId)
    try {
      await sendChange(() => deleteFile(assetType, fileId))
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
      getList()

      return
    }
    if (ofMainFile) fileChanged(assetId)
    getListAfterChange()
  }

  const makeMainFile = async (fileId: DocId) => {
    if (changeOnItsWay()) return
    try {
      await sendChange(() => apiMakeMainFile(assetType, fileId, assetId))
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
      getList()

      return
    }
    // The Info tab shows the asset's main file, which has changed now.
    fileChanged(assetId)
    getListAfterChange()
  }

  const unsetSlot = async (data: { fileId: DocId; slotName: string }) => {
    if (changeOnItsWay()) return
    try {
      await sendChange(() => unsetAssetSlot(assetType, data.fileId, assetId, data.slotName))
    } catch (e) {
      if (!showErrorsDefault(e)) showUnknownError()
    } finally {
      getList()
    }
  }

  const duplicateSlot = async (data: { fileId: DocId; targetSlotName: string }) => {
    if (changeOnItsWay()) return
    try {
      await sendChange(() => existingFileToSlot(assetType, data.fileId, assetId, data.targetSlotName))
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
