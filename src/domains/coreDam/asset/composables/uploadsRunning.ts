import { RELOAD_VETO_GRACE, UploadQueueItemStatus, isArray, isNull, isUndefined } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'
import { useEventListener } from '@vueuse/core'

import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { queueRowBaseline, queueRowHoldsUnsaved } from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import { ACL, useAuth } from '@/domains/system/auth/auth'

/**
 * Whether a queue still sends a file: an upload, a slot upload or an import from an external provider.
 * A reload or a closed window loses it. The upload queues outlive pages, so this holds on any page.
 */
export const uploadsRunning = () => useUploadQueuesStore().uploadsRunning

// "Empty" as the queue's mass operations and the first metadata load of a row define it.
const isEmptyValue = (value: unknown) =>
  isUndefined(value) || isNull(value) || value === '' || (isArray(value) && value.length === 0)

/*
 * A row of an upload whose metadata are not read yet: its file is still processed, or the read failed.
 * Only a mass operation writes into it then, and its first metadata keep what that wrote, for its Save.
 * Its switches come from the server and are left out. Nothing of a failed, stopped or duplicate row can be saved.
 */
const holdsInputBeforeMetadata = (item: UploadQueueItem) =>
  !isNull(item.assetId) &&
  !item.isDuplicate &&
  item.status !== UploadQueueItemStatus.Failed &&
  item.status !== UploadQueueItemStatus.Stop &&
  !queueRowBaseline(item) &&
  (!isEmptyValue(item.keywords) ||
    !isEmptyValue(item.authors) ||
    !isEmptyValue(item.sources) ||
    Object.values(item.customData ?? {}).some((value) => !isEmptyValue(value)))

/**
 * Whether a row of a queue holds metadata typed or picked into it and not saved yet.
 * Not part of `uploadsRunning`: the reload to a new version waits only for files, not for typed text.
 * Never for a user who may not update assets: the queues offer no Save then (DAM-B26).
 */
export const queueMetadataUnsaved = () =>
  useAuth().canSafe(ACL.DAM_ASSET_UPDATE) &&
  Object.values(useUploadQueuesStore().queues).some((queue) =>
    queue.items.some((item) => (item.canEditMetadata ? queueRowHoldsUnsaved(item) : holdsInputBeforeMetadata(item)))
  )

/*
 * Set while the page goes after the application itself asked whether to drop the work of the queues.
 * The browser would ask a second time, and its "Stay" would keep a page whose leaving was already acted on.
 * Ends after the time a reload takes to commit, so a page kept by another question asks again.
 */
let leavingAsked = false

/** Runs `leave`, which unloads the page, without the browser asking about the queues again. */
export function leaveAfterAsking(leave: () => void) {
  leavingAsked = true
  setTimeout(() => {
    leavingAsked = false
  }, RELOAD_VETO_GRACE)
  leave()
}

/**
 * Lets the browser ask before a reload or window close while a file is still being sent,
 * or while a queue row holds metadata that are not saved.
 * Registered once for the whole application: an upload continues on every page.
 */
export function useUploadsRunningUnloadGuard() {
  useEventListener(window, 'beforeunload', (event) => {
    if (leavingAsked) return
    if (!uploadsRunning() && !queueMetadataUnsaved()) return
    event.preventDefault()
    // Older browsers ask only when this is set.
    event.returnValue = ''
  })
}
