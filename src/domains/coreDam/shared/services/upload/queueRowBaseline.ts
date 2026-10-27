import { cloneDeep, isArray, isObject } from '@anzusystems/common-admin'
import type { AssetCustomData, AssetDetailItemDto, DocId, UploadQueueItem } from '@anzusystems/common-admin'
import { toRaw } from 'vue'

/*
 * The queue row metadata as last received from or saved to the server.
 * The bulk save sends only fields that differ, so untouched fields do not overwrite another editor's changes.
 * Stored per row and removed with it. A row without a baseline is sent whole.
 */

export interface QueueRowMetadata {
  keywords: DocId[]
  authors: DocId[]
  customData: AssetCustomData
  mainFileSingleUse: boolean | null
}

/**
 * `described` is undefined when the response did not include it.
 */
export interface QueueRowBaseline extends QueueRowMetadata {
  described: boolean | undefined
}

/*
 * Orders metadata reads and saves.
 * A response requested before the row got its baseline is older than the row's data, however late it arrives.
 */
let order = 0

/**
 * A read takes a number when sent; a baseline writer takes one when writing.
 */
export const nextMetadataOrder = () => ++order

/*
 * Metadata saves in flight per asset, from the queue, detail or panel.
 * A read sent meanwhile may reflect the state before or after the save.
 * A read sent when no save is in flight reflects all saves.
 */
const savesOnTheirWay = new Map<DocId, number>()
const afterSaves = new Map<DocId, Array<() => void>>()

/**
 * Call when a metadata save is sent. Call the returned function once it is answered or failed.
 */
export const metadataSaveSent = (assetIds: DocId[]) => {
  assetIds.forEach((assetId) => savesOnTheirWay.set(assetId, (savesOnTheirWay.get(assetId) ?? 0) + 1))
  let ended = false

  return () => {
    if (ended) return
    ended = true
    assetIds.forEach((assetId) => {
      const left = (savesOnTheirWay.get(assetId) ?? 1) - 1
      if (left > 0) {
        savesOnTheirWay.set(assetId, left)
        return
      }
      savesOnTheirWay.delete(assetId)
      const then = afterSaves.get(assetId) ?? []
      afterSaves.delete(assetId)
      then.forEach((call) => call())
    })
  }
}

export const metadataSaveOnItsWay = (assetId: DocId) => savesOnTheirWay.has(assetId)

/**
 * Runs `then` once no metadata save of the asset is in flight, immediately if none is.
 */
export const afterMetadataSaves = (assetId: DocId, then: () => void) => {
  if (!savesOnTheirWay.has(assetId)) return then()
  afterSaves.set(assetId, [...(afterSaves.get(assetId) ?? []), then])
}

const baselines = new WeakMap<UploadQueueItem, { baseline: QueueRowBaseline; at: number }>()

export const baselineOfAsset = (asset: AssetDetailItemDto): QueueRowBaseline => ({
  keywords: asset.keywords,
  authors: asset.authors,
  customData: asset.metadata.customData,
  mainFileSingleUse: asset.mainFileSingleUse,
  described: asset.flags?.described,
})

export const metadataOfQueueRow = (item: UploadQueueItem): QueueRowMetadata =>
  cloneDeep({
    keywords: item.keywords,
    authors: item.authors,
    customData: item.customData,
    mainFileSingleUse: item.mainFileSingleUse,
  })

/**
 * Stores a copy because the row and the response keep being mutated.
 * `at` is the baseline's position in the read and save order.
 */
export const setQueueRowBaseline = (item: UploadQueueItem, baseline: QueueRowBaseline, at: number) => {
  baselines.set(toRaw(item), { baseline: cloneDeep(baseline), at })
}

export const queueRowBaseline = (item: UploadQueueItem) => baselines.get(toRaw(item))?.baseline

/**
 * Equality as the server sees it: arrays by values in order, objects by keys.
 * A key with no value equals a missing key, matching how it is sent.
 */
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

/**
 * Whether the row got its metadata after `sentAt`. If so, a response requested at `sentAt` is stale.
 */
export const queueRowGivenSince = (item: UploadQueueItem, sentAt: number) =>
  (baselines.get(toRaw(item))?.at ?? 0) > sentAt

/**
 * Whether a row may take a response requested at `sentAt`.
 * True when the response is newer than the baseline and the row is unchanged since.
 * False for a row without a baseline.
 */
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
