import { AssetFileProcessStatus, DamAssetStatus, isNull, useAlerts, useDamCachedUsers } from '@anzusystems/common-admin'
import type { AssetDetailItemDto, AssetFileProcessStatusType, DocId } from '@anzusystems/common-admin'
import { inject, onBeforeUnmount, provide } from 'vue'
import type { InjectionKey } from 'vue'

import { assetDeletedHere, fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
import {
  assetDeleteOnItsWay,
  deletingTakenOverWhileOnItsWay,
} from '@/domains/coreDam/asset/composables/assetDeleteOnce'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { metadataMayStillChange } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { useWhileOnPage } from '@/domains/system/composables/whileOnPage'

/*
 * The page is told about a file change (main file route or which
 * file is main) through a provided function, not an event.
 * The change answers after a request, and the component may be
 * unmounted by then. Vue drops events from unmounted components.
 */
const AssetFileChangedKey: InjectionKey<() => void> = Symbol('assetFileChanged')

/**
 * Call in the setup of the page that draws the detail.
 * `fileChanged` is called by detail parts, and through the detail
 * store by the upload queue and notifications while the page exists.
 * `byServer` is set when the server has processed a file.
 */
export const provideAssetFileChanged = (fileChanged: (byServer?: boolean) => void) => {
  provide(AssetFileChangedKey, fileChanged)
  onBeforeUnmount(useAssetDetailStore().tellPageBy(() => fileChanged(true)))
}

/**
 * Call in the setup of a detail part that changes the asset's file.
 * Call the result after the change, with the asset it was for.
 * The page is told only if the detail still holds that asset.
 * While the detail loader is up, the detail still holds the previous asset, so the page is told once that read lands.
 * If the read is of the same asset it may predate the change, so the page reads again, bypassing the recent-read cache.
 */
export const useAssetFileChanged = () => {
  const tellPage = inject(AssetFileChangedKey, () => undefined)
  const assetDetailStore = useAssetDetailStore()

  return (assetId: DocId) => {
    assetDetailStore.forgetLastFetched([assetId])
    assetDetailStore.readAfterCurrentRead(() => {
      if (assetDetailStore.asset?.id === assetId) tellPage()
    })
  }
}

/*
 * Counts loader-less reads: two changes, or a change and a server
 * notice, can overlap and the older answer can arrive last.
 * Only the latest read is applied.
 */
let latestQuietRead = 0

/*
 * States after processing ran, when the server may have filled in metadata from the file.
 * `Failed` is included because metadata are saved before processing
 * ends. A duplicate is not: it is detected before anything is saved.
 */
const PROCESSING_RAN: AssetFileProcessStatusType[] = [AssetFileProcessStatus.Processed, AssetFileProcessStatus.Failed]

/*
 * Whether the form of `held` can be older than the server's metadata,
 * which the server fills in from the file for an undescribed asset.
 * True when the held main file was still processing, unless the server found it a duplicate.
 * Also true when none was held and the answer brings a first file whose processing ran.
 * One still processing blocks "Save" by its state and is reported again when done.
 */
const formMayBeOlder = (held: AssetDetailItemDto, read: AssetDetailItemDto) => {
  const before = held.mainFile
  const now = read.mainFile
  if (!before) return !!now && PROCESSING_RAN.includes(now.fileAttributes.status) && !held.flags.described
  if (now?.id === before.id && now.fileAttributes.status === AssetFileProcessStatus.Duplicate) return false

  return metadataMayStillChange(held)
}

/* Rereads the detail's asset after its file changes, in the list dialog, the side panel and the detail pages alike. */
export function useAssetDetailFileChange() {
  const assetDetailStore = useAssetDetailStore()
  const whileOnPage = useWhileOnPage()
  const { showErrorsDefault, showWarningT } = useAlerts()
  const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

  /*
   * Reads the held asset without a loader, so the form, tabs and dialogs with typed input stay mounted.
   * Unsaved metadata stay. Only the main file and its asset state are taken from the answer.
   * If "Save" was held back because the server could still fill metadata, it stays
   * held back, also for a first file processed or failed by now. Not for a duplicate.
   * `whole`: replace the form with the answer (`setAsset`, frees "Save") only if nothing is typed and no save
   * went out, both at request and answer. Otherwise a read sent before a save could write old values back.
   */
  const readQuietly = async (whole: boolean) => {
    const held = assetDetailStore.asset
    if (isNull(held)) return
    const asked = ++latestQuietRead
    // Applied only to the asset it was read for, and only if no newer read started.
    const isTaken = () => assetDetailStore.asset === held && asked === latestQuietRead
    const savesBefore = assetDetailStore.savesOf(held.id)
    const formIsAsRead = () =>
      !assetDetailStore.metadataAreTouched && savesBefore !== null && assetDetailStore.savesOf(held.id) === savesBefore
    const takesWhole = whole && formIsAsRead()
    let res: AssetDetailItemDto
    try {
      res = await fetchAsset(held.id)
    } catch (error) {
      // The server's file notice is still unread, so a repeated notice triggers the read again.
      assetDetailStore.readOfToldFailed()
      if (isTaken()) whileOnPage(() => showErrorsDefault(error))
      return
    }
    if (!isTaken()) return
    /*
     * Deleted elsewhere meanwhile: treat it as being deleted and say so, not only disable buttons.
     * Not for a delete sent here: the server marks it before answering,
     * and the sender gets the answer after the delete is known here.
     */
    const deletingNow = res.attributes.assetStatus === DamAssetStatus.Deleting
    if (deletingNow && held.attributes.assetStatus !== DamAssetStatus.Deleting) {
      const say = () => whileOnPage(() => showWarningT('coreDam.asset.detail.deletedMeanwhile'))
      // If a delete from here is in flight, say it only once that delete fails, while still on this page.
      if (assetDeleteOnItsWay(held.id)) deletingTakenOverWhileOnItsWay(held.id, say)
      else if (!assetDeletedHere(held.id)) say()
    }
    if (takesWhole && formIsAsRead()) {
      assetDetailStore.setAsset(res)
      assetDetailStore.updateLastFetched(held.id)
      addToCachedUsers(res.createdBy, res.modifiedBy)
      fetchCachedUsers()
      return
    }
    assetDetailStore.setMainFile(res, formMayBeOlder(held, res))
  }

  /**
   * After a user change with nothing typed, the page reads the asset whole (`readWhole`).
   * A server notice (`byServer`) always reads quietly, because it can arrive during any user action.
   */
  const readAfterFileChange = (readWhole: () => Promise<void>, byServer = false) => {
    if (byServer) return readQuietly(true)

    return assetDetailStore.holdsUnsavedMetadata ? readQuietly(false) : readWhole()
  }

  return { readAfterFileChange }
}
