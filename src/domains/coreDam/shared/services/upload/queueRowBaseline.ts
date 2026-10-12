import { cloneDeep, isArray, isObject } from '@anzusystems/common-admin'
import type { AssetCustomData, AssetDetailItemDto, DocId, UploadQueueItem } from '@anzusystems/common-admin'
import { toRaw } from 'vue'

/* The metadata of a queue row as the server has them, as far as this application knows: what the row last got from
 * the server, or what was last saved of it. The bulk save sends the fields that differ from that, so a field nobody
 * touched here does not overwrite what another editor saved meanwhile. Kept by the row and gone with it; a row
 * without one is sent whole. */

export interface QueueRowMetadata {
  keywords: DocId[]
  authors: DocId[]
  customData: AssetCustomData
  mainFileSingleUse: boolean | null
}

/** With whether the server has the asset marked described: not known when the answer did not say. */
export interface QueueRowBaseline extends QueueRowMetadata {
  described: boolean | undefined
}

/* The reads and the saves of metadata, in their order: an answer of the server asked for before a row got its
 * baseline is older than what the row holds, however late it comes. */
let order = 0

/** The next place in that order: a read takes one as it is sent, whatever writes a baseline as it writes it. */
export const nextMetadataOrder = () => ++order

const baselines = new WeakMap<UploadQueueItem, { baseline: QueueRowBaseline; at: number }>()

export const baselineOfAsset = (asset: AssetDetailItemDto): QueueRowBaseline => ({
  keywords: asset.keywords,
  authors: asset.authors,
  customData: asset.metadata.customData,
  mainFileSingleUse: asset.mainFileSingleUse,
  described: asset.flags?.described,
})

/** A copy of what the row holds now. */
export const metadataOfQueueRow = (item: UploadQueueItem): QueueRowMetadata =>
  cloneDeep({
    keywords: item.keywords,
    authors: item.authors,
    customData: item.customData,
    mainFileSingleUse: item.mainFileSingleUse,
  })

/** A copy is kept: the row, and the answer the values came with, go on being written into. `at` is the place of
 * what the baseline is from in the order of the reads and the saves. */
export const setQueueRowBaseline = (item: UploadQueueItem, baseline: QueueRowBaseline, at: number) => {
  baselines.set(toRaw(item), { baseline: cloneDeep(baseline), at })
}

export const queueRowBaseline = (item: UploadQueueItem) => baselines.get(toRaw(item))?.baseline

/** Equal as the server reads them: a list by its values in their order, an object by its keys, and a key without a
 * value as a key that is not there, which is how it is sent. */
export const sameMetadataValue = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (isArray(a) || isArray(b)) {
    return (
      isArray(a) && isArray(b) && a.length === b.length && a.every((value, index) => sameMetadataValue(value, b[index]))
    )
  }
  if (!isObject(a) || !isObject(b)) return false
  const one = a as Record<string, unknown>
  const other = b as Record<string, unknown>

  return [...new Set([...Object.keys(one), ...Object.keys(other)])].every((key) =>
    sameMetadataValue(one[key], other[key])
  )
}

/** Whether the row was given its metadata after `sentAt`: an answer of the server asked for then is older than what
 * the row holds, form or no form. */
export const queueRowGivenSince = (item: UploadQueueItem, sentAt: number) =>
  (baselines.get(toRaw(item))?.at ?? 0) > sentAt

/** Whether a row that has its metadata may take an answer of the server that was asked for at `sentAt`: the answer
 * is newer than what the row was last given, and nobody changed the row since. Not a row without a baseline, of
 * which neither is known. */
export const queueRowTakesAnswer = (item: UploadQueueItem, sentAt: number) => {
  const known = baselines.get(toRaw(item))

  return (
    !!known &&
    known.at < sentAt &&
    sameMetadataValue(item.keywords, known.baseline.keywords) &&
    sameMetadataValue(item.authors, known.baseline.authors) &&
    sameMetadataValue(item.customData, known.baseline.customData) &&
    item.mainFileSingleUse === known.baseline.mainFileSingleUse
  )
}
