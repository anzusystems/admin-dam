import type { DocId } from '@anzusystems/common-admin'
import { reactive } from 'vue'

import { deleteAsset } from '@/domains/coreDam/asset/api/assetApi'

/*
 * Asset deletes in progress, one per asset. A second delete before the first
 * answers does nothing useful: the server returns another "deleted" or an error.
 * Kept outside components because the queue row or detail part can unmount and remount meanwhile.
 */
const onTheirWay = reactive(new Set<DocId>())

/** Whether a delete of the asset is in progress. No button offers another delete meanwhile. */
export const assetDeleteOnItsWay = (assetId: DocId | null | undefined) => !!assetId && onTheirWay.has(assetId)

/*
 * Assets that a read saw as deleting while a local delete was in progress.
 * The local delete is the likelier cause, so the read stays silent.
 * If the local delete fails, the other delete was real, and the stored callback reports it on its own page.
 */
const takenOverWhileOnItsWay = new Map<DocId, () => void>()

/** Registers `say` to report a delete seen by a read, called if the local delete in progress fails. */
export const deletingTakenOverWhileOnItsWay = (assetId: DocId, say: () => void) =>
  takenOverWhileOnItsWay.set(assetId, say)

/** Deletes the asset like `deleteAsset`. Returns false without sending while a delete of it is in progress. */
export async function deleteAssetOnce(assetId: DocId) {
  if (onTheirWay.has(assetId)) return false
  onTheirWay.add(assetId)
  try {
    await deleteAsset(assetId)
  } catch (error) {
    takenOverWhileOnItsWay.get(assetId)?.()
    throw error
  } finally {
    onTheirWay.delete(assetId)
    takenOverWhileOnItsWay.delete(assetId)
  }

  return true
}
