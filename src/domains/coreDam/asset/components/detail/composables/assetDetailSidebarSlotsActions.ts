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

// The assets a change of a slot is on its way for, whichever part of a detail sent it: see the changes below.
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

  /* The list of the slots is one store for every asset, and this reads into it the slots of one: the asset of the
   * part of a detail it was made for, its Slots tab or a select of its slots. What is asked about them can be
   * answered once the detail holds another asset - after a change that took long, with the next asset of the list
   * gone on to meanwhile. Written then, the rows of this asset are drawn in the Slots tab of that one, where the menu
   * of a row deletes the file of the row, or puts it into a slot of the asset of the tab. So an answer is written
   * only while the detail holds this asset, and only while nothing was asked about the slots since: of two reads,
   * the answer of the older can come last. And the list is of this asset from the moment the part is made, before it
   * is drawn and reads: rows of another asset are not drawn until the read is answered, nor left there when it fails.
   * Every part that reads the list makes this first. */
  const detailHoldsAsset = () => assetDetailStore.asset?.id === assetId
  assetSlotsStore.holdListOf(assetId)
  // The count the loader of the slots went up at for this part of the detail last: for a read, or for a change.
  let raisedLoader = 0
  const showLoader = () => (raisedLoader = assetSlotsStore.showLoader())

  const getList = async () => {
    /* Nothing is read for a detail that holds another asset by now: only the loader a change put up is taken down,
     * unless the tab of that asset has put it up since. */
    if (!detailHoldsAsset()) {
      assetSlotsStore.hideLoader(raisedLoader)

      return
    }
    const asked = showLoader()
    const isTaken = () => assetSlotsStore.isAwaited(asked) && detailHoldsAsset()
    // Without the finally a failed fetch leaves the slot panel spinning with nothing to say, and
    // every mutation below ends in this read, or leaves it to the tab that is drawn again.
    try {
      const items = await fetchAssetSlotList(assetId, pagination, filterData, filterConfig)
      if (isTaken()) assetSlotsStore.setList(items, assetId)
    } catch (error) {
      if (isTaken()) showErrorsDefault(error)
    } finally {
      // After an answer that was not written as well: nothing else would take the loader down for it.
      assetSlotsStore.hideLoader(asked)
    }
  }

  /* The read of the slots after a change the page that draws the detail was told of just before. With nothing typed
   * the page reads the asset whole, and the detail is behind its loader from that moment: the tab goes with it, and
   * reads the slots as it is mounted again. A read from here too would be a second one, for nothing: the loader of
   * the slots stays up for the tab that is drawn again. */
  const getListAfterChange = async () => {
    if (assetDetailStore.loader) return
    await getList()
  }

  /* The four changes of a slot below go one at a time: pressed a second time while the first is on its way, a change
   * would be sent again, and refused over the one that went through. The loader that goes up with a change takes the
   * rows away, with their menus and their dialogs, but only once the tab is drawn again; and a read of the slots
   * takes it down under the change - the tab drawn again reads them, and its rows are back. So a change is also known
   * as on its way until it is answered, for its asset. Each says when it failed: all but the delete of an image
   * reject with what axios threw, or with nothing at all, and neither is an error the alerts know. */
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
    // Once the main file of the asset is deleted, the server makes another of its files the main one, or none.
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
    // The Info tab of the detail shows the main file of the asset, and that is another one now.
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
