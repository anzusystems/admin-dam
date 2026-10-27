import { isNull } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'

import { fetchAsset, hasMetadataToSave } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'

/*
 * Bulk save of a footer queue (mass edit, upload queue) coordinated with the detail store asset shown in the panel.
 * Unsaved panel input for a saved asset is confirmed before the save, and the asset is read again after it.
 */
export function useAssetFooterBulkSave() {
  const assetDetailStore = useAssetDetailStore()

  /*
   * The detail store asset is stale after the save, so it is read again by id when it was saved.
   * Also under a closed panel, whose toggle opens it from the store without
   * a read. Not the active list row, which the panel need not show.
   */
  const readAgainIfSaved = async (savedAssetIds: string[]) => {
    assetDetailStore.forgetLastFetched(savedAssetIds)
    const shown = assetDetailStore.asset
    if (isNull(shown) || !savedAssetIds.includes(shown.id)) return
    /*
     * Already being read behind the loader, by a file change that waited for the same read. That read
     * started after the save answered, so it returns the saved asset and reports its own failure.
     * Reading again here would cancel it silently.
     */
    if (assetDetailStore.loader && assetDetailStore.shownOrReadAssetId() === shown.id) return
    assetDetailStore.showLoader()
    const detailRequest = assetDetailStore.startDetailRequest(shown.id)
    try {
      const res = await fetchAsset(shown.id)
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.setAsset(res, detailRequest)
    } catch (error) {
      // The save itself succeeded, so the detail keeps its previous data.
      console.error('assetFooterBulkSave: the asset of the detail could not be read again', error)
    } finally {
      if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
    }
  }

  /*
   * A detail read in progress when the save answers may return the pre-save asset. The re-read
   * waits for it to land, so it neither discards that answer nor leaves its loader up.
   * A later read is answered after the save, and the shortcut that skips reading a saved asset is disabled.
   */
  const refreshDetailAsset = (savedAssetIds: string[]) => {
    assetDetailStore.forgetLastFetched(savedAssetIds)
    assetDetailStore.readAfterCurrentRead(() => void readAgainIfSaved(savedAssetIds))
  }

  // Taken before the save because the queue can change while the request is in flight.
  const assetIdsToSave = (items: UploadQueueItem[]) => items.filter(hasMetadataToSave).map((item) => item.assetId)

  /*
   * The post-save read overwrites unsaved panel input, so ask first, like every other path that discards it.
   * "Stay" returns `null` and sends nothing. "Leave anyway" returns the asset id, saves, and the
   * read replaces the input. No input or another asset in the panel returns `false` without asking.
   * After "Leave anyway" the form blocks typing during the save: the
   * queue can close meanwhile, and that input would be silently replaced.
   */
  const leaveTypedOfPanel = async (savedAssetIds: string[]) => {
    const held = assetDetailStore.asset
    if (!assetDetailStore.panelHoldsUnsavedMetadata || isNull(held) || !savedAssetIds.includes(held.id)) return false
    if (!(await assetDetailStore.askToLeaveUnsaved())) return null
    assetDetailStore.leftForMassSave = held.id

    return held.id
  }

  /*
   * On success the post-save read has started behind the loader, or none
   * comes (another asset in the panel). On failure the form is restored.
   */
  const panelTakesTypingAgain = (left: string | false) => {
    if (left && assetDetailStore.leftForMassSave === left) assetDetailStore.leftForMassSave = null
  }

  /*
   * After a failed save following "Leave anyway" nothing is read. The input
   * stays unsaved and is asked about again, also behind a later read's loader.
   */
  const typedKeptAfterFailure = (left: string | false) => {
    if (left) assetDetailStore.typedLeft = false
  }

  return { assetIdsToSave, leaveTypedOfPanel, refreshDetailAsset, panelTakesTypingAgain, typedKeptAfterFailure }
}
