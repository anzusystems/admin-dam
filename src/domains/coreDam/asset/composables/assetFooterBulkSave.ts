import { isNull } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'

import { fetchAsset, hasMetadataToSave } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'

/* A bulk save of a queue drawn in a footer - the mass edit, the upload queue - and the asset of the detail store, which
 * the panel beside the list shows: what was typed there for a saved asset is asked about before the save, and the asset
 * is read again after it. */
export function useAssetFooterBulkSave() {
  const assetDetailStore = useAssetDetailStore()

  /* The asset of the detail store still has what it had before the save: it is read again, by its id, when it was among
   * the saved - also under a closed panel, whose toggle opens it on the store without a read. Not the active row of
   * the list, which the panel need not show. */
  const readAgainIfSaved = async (savedAssetIds: string[]) => {
    assetDetailStore.forgetLastFetched(savedAssetIds)
    const shown = assetDetailStore.asset
    if (isNull(shown) || !savedAssetIds.includes(shown.id)) return
    /* Read already, behind the loader: by what a change of a file of the asset set off, which waited for the same read as
     * this one. Started once the save was answered, that read brings the asset as saved, and says so when it fails -
     * read here again, it would be called off unseen. */
    if (assetDetailStore.loader && assetDetailStore.shownOrReadAssetId() === shown.id) return
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest(shown.id)
    try {
      const res = await fetchAsset(shown.id)
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.setAsset(res, detailRequest)
    } catch (error) {
      // The save itself went through: the detail keeps what it had, as before.
      console.error('assetFooterBulkSave: the asset of the detail could not be read again', error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /* A read of the detail on its way when the save answers may bring an asset as it was before the save: the read again
   * waits for it to land, so that it neither throws that answer away nor leaves its loader up. A read that starts
   * later is answered after the save, and the shortcut that would skip the read of a saved asset is not taken. */
  const refreshDetailAsset = (savedAssetIds: string[]) => {
    assetDetailStore.forgetLastFetched(savedAssetIds)
    assetDetailStore.readAfterCurrentRead(() => void readAgainIfSaved(savedAssetIds))
  }

  // What the bulk save sends, taken before it: the queue can change while it is on the wire.
  const assetIdsToSave = (items: UploadQueueItem[]) => items.filter(hasMetadataToSave).map((item) => item.assetId)

  /* The read after the save puts the asset as saved into the panel beside the list, over what was typed into it and not
   * saved: asked about first, as every other way that throws that away. "Stay" sends nothing (`null`); "Leave anyway"
   * saves, and the read replaces what was typed (the id of the asset). With nothing typed, or another asset in the panel,
   * nothing is asked (`false`). Let go, the form takes no typing while the save is on its way: the queue can be put
   * away meanwhile, and what was typed then would be replaced without a word. */
  const leaveTypedOfPanel = async (savedAssetIds: string[]) => {
    const held = assetDetailStore.asset
    if (!assetDetailStore.panelHoldsUnsavedMetadata || isNull(held) || !savedAssetIds.includes(held.id)) return false
    if (!(await assetDetailStore.askToLeaveUnsaved())) return null
    assetDetailStore.leftForMassSave = held.id

    return held.id
  }

  /* Answered: the read after the save has started by now, behind the loader, or there is none to come (another asset in
   * the panel). Failed: the form is given back as it was. */
  const panelTakesTypingAgain = (left: string | false) => {
    if (left && assetDetailStore.leftForMassSave === left) assetDetailStore.leftForMassSave = null
  }

  /* A save that failed after "Leave anyway" reads nothing: what was typed stays in the panel, unsaved, and is asked
   * about again - also behind the loader of a read that comes later. */
  const typedKeptAfterFailure = (left: string | false) => {
    if (left) assetDetailStore.typedLeft = false
  }

  return { assetIdsToSave, leaveTypedOfPanel, refreshDetailAsset, panelTakesTypingAgain, typedKeptAfterFailure }
}
