import type { DocId } from '@anzusystems/common-admin'
import { reactive } from 'vue'

import { deleteAsset } from '@/domains/coreDam/asset/api/assetApi'

/* The deletes of assets on their way, by the asset: one at a time. A second one sent before the first is answered
 * deletes nothing more - the server answers it as a delete of its own, a second "deleted", or with an error once the
 * asset is gone. Outside of every component: the row of a queue and the part of the detail that sent one can be
 * unmounted and drawn anew while it is on its way. */
const onTheirWay = reactive(new Set<DocId>())

/** Whether a delete of the asset is on its way: no button offers another meanwhile. */
export const assetDeleteOnItsWay = (assetId: DocId | null | undefined) => !!assetId && onTheirWay.has(assetId)

/* The assets a read took over as being deleted while a delete of them was on its way here: that read says nothing of a
 * delete made elsewhere, the delete here being the likelier one. When that delete fails, it was the other one, and the
 * read says so then - by what it is handed here, which says it only on its own page. */
const takenOverWhileOnItsWay = new Map<DocId, () => void>()

/** A read took the asset over as being deleted while a delete of it is on its way here: `say` it, if that one fails. */
export const deletingTakenOverWhileOnItsWay = (assetId: DocId, say: () => void) =>
  takenOverWhileOnItsWay.set(assetId, say)

/** Deletes the asset, as `deleteAsset`: false, with nothing sent, while a delete of it is on its way. */
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
