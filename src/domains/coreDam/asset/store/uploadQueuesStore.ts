import {
  AssetFileFailReason,
  AssetFileLinkType,
  AssetFileProcessStatus,
  DamAssetStatus,
  DamAssetType,
  UPLOAD_QUEUE_ITEM_CHUNK_SIZE,
  UploadQueueItemStatus,
  UploadQueueItemType,
  UploadRowRole,
  adminDamImportRun,
  adminDamQueuePreset,
  apiErrorIsReported,
  apiErrorStatus,
  cloneDeep,
  createUploadQueueCore,
  damFileTypeFix,
  getAssetTypeByMimeType,
  isNull,
  isUndefined,
  uploadQueueFillAuthors,
  uploadQueueFillCustomDataValue,
  uploadQueueFillKeywords,
  useAlerts,
  useAssetSuggestions,
  useDamConfigState,
  useDamNotificationsConnection,
  useUploadQueueItemFactory,
} from '@anzusystems/common-admin'
import type {
  AssetDetailItemDto,
  AssetFileFailReasonType,
  AssetFileNullable,
  AssetFileProcessStatusType,
  AssetSearchListItemDto,
  CustomDataValue,
  DamAssetTypeType,
  DocId,
  DocIdNullable,
  UploadQueue,
  UploadQueueItem,
  UploadReadOptions,
  UploadRefreshOutcome,
  UploadRowRoleType,
  UploadSettlePolicy,
} from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, toRaw } from 'vue'

import { fetchAsset, fetchAssetListByIds, fetchWaitingAssets } from '@/domains/coreDam/asset/api/assetApi'
import { fetchAssetSlotFiles } from '@/domains/coreDam/asset/api/assetSlotApi'
import { fetchAudioFile } from '@/domains/coreDam/asset/api/audioApi'
import { fetchDocumentFile } from '@/domains/coreDam/asset/api/documentApi'
import { fetchImageFile } from '@/domains/coreDam/asset/api/imageApi'
import { fetchVideoFile } from '@/domains/coreDam/asset/api/videoApi'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useExternalProviders } from '@/domains/coreDam/asset/composables/externalProviders'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'
import { externalProviderImport } from '@/domains/coreDam/shared/services/upload/externalProviderImportService'
import {
  afterMetadataSaves,
  baselineOfAsset,
  metadataSaveOnItsWay,
  nextMetadataOrder,
  queueRowGivenSince,
  queueRowTakesAnswer,
  setQueueRowBaseline,
} from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import { QUEUE_ID_MASS_EDIT, QUEUE_ID_UPLOAD_GLOBAL } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { resolveUploadErrorMessage, useUpload } from '@/domains/coreDam/shared/services/upload/uploadService'
import { i18n } from '@/plugins/i18n'
import { damClient } from '@/shared/apiClients/damClient'

// Outside a component, so use the global i18n instance, as `uploadService` does.
const translate = (key: string) => {
  const { t } = i18n.global

  return t(key)
}

const roleOf = (item: UploadQueueItem): UploadRowRoleType => {
  switch (item.type) {
    case UploadQueueItemType.SlotFile:
      return UploadRowRole.Slot
    case UploadQueueItemType.Asset:
      return UploadRowRole.MassEdit
    case UploadQueueItemType.ExternalProviderAsset:
      return UploadRowRole.ExternalImport
    default:
      return UploadRowRole.Upload
  }
}

/*
 * How settlement handles a row, by its role.
 * A processed file's state is written from its notification at once, and the
 * following read completes the row. A duplicate stays as it was, marked.
 */
const policyFor = (role: UploadRowRoleType): UploadSettlePolicy => {
  switch (role) {
    // The asset only describes its main file, so a slot is read from the slots list. Slots have no form.
    case UploadRowRole.Slot:
      return { reader: 'slots', settleOn: 'event', duplicate: 'markDuplicate', metadata: 'none' }
    // Never polled: the batch load owns the status, and a processed file only completes the row.
    case UploadRowRole.MassEdit:
      return { reader: 'none', settleOn: 'never', duplicate: 'markDuplicate', metadata: 'load' }
    default:
      return { reader: 'asset', settleOn: 'event', duplicate: 'markDuplicate', metadata: 'load' }
  }
}

/*
 * The poll repeats while a row waits. Settlement marks which failure starts
 * a streak, and only that one goes to the api error logger via `report`.
 */

// A missing asset is an answer the settlement counts. Anything else is a failed read.
const readAsset = async (assetId: DocId, options?: UploadReadOptions) => {
  try {
    return options?.report === false ? await fetchAsset(assetId, { report: false }) : await fetchAsset(assetId)
  } catch (error) {
    if (apiErrorStatus(error) === 404) return null
    throw error
  }
}

// The multi-asset read and the slots read below report only when told to.
const readAssets = (licenceId: number, assetIds: DocId[], options?: UploadReadOptions) =>
  fetchWaitingAssets(assetIds, licenceId, { report: options?.report === true })

// Not yet processed by the server: it may still fill in the metadata of a non-described asset.
const STILL_PROCESSING: AssetFileProcessStatusType[] = [
  AssetFileProcessStatus.Uploading,
  AssetFileProcessStatus.Uploaded,
  AssetFileProcessStatus.Stored,
]

/*
 * The server may still fill in metadata from the file, and a form loaded now would overwrite it on save.
 * Used by the mass edit, the detail and the list panel.
 */
export const metadataMayStillChange = (asset: AssetDetailItemDto) =>
  !!asset.mainFile && STILL_PROCESSING.includes(asset.mainFile.fileAttributes.status) && !asset.flags.described

// @todo product question what to do with duplicate file display
const fetchDuplicateOriginFile = async (
  originFileId: DocId,
  assetType: DamAssetTypeType
): Promise<AssetFileNullable> => {
  switch (assetType) {
    case DamAssetType.Image:
      return await fetchImageFile(originFileId)
    case DamAssetType.Audio:
      return await fetchAudioFile(originFileId)
    case DamAssetType.Video:
      return await fetchVideoFile(originFileId)
    case DamAssetType.Document:
      return await fetchDocumentFile(originFileId)
  }

  return null
}

/*
 * How the server ended a settled row's file: processed, duplicate, or failed.
 * Server failures carry a reason; client or read failures do not. Null when the server did not report an end.
 */
const slotFileEndedAs = (item: UploadQueueItem): AssetFileProcessStatusType | null => {
  if (item.status === UploadQueueItemStatus.Uploaded) {
    return item.isDuplicate ? AssetFileProcessStatus.Duplicate : AssetFileProcessStatus.Processed
  }
  if (item.status === UploadQueueItemStatus.Failed && item.error.assetFileFailReason !== AssetFileFailReason.None) {
    return AssetFileProcessStatus.Failed
  }

  return null
}

export const useUploadQueuesStore = defineStore('damUploadQueuesStore', () => {
  // Mass-edit rows whose batch load failed to get metadata. Keyed by
  // row, not message, because the message changes with the language.
  const metadataFailures = new Set<string>()
  const metadataFailureKey = (queueId: string, item: UploadQueueItem) => queueId + '/' + item.key
  // Mass-edit rows the batch load left without metadata, regardless of
  // their file state. Their form is empty and the bulk save would send it.
  const leftOutByBatch = new WeakSet<UploadQueueItem>()

  const { createDefault } = useUploadQueueItemFactory()
  const { showError } = useAlerts()
  const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
  const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

  const queues = ref<{ [queueId: string]: UploadQueue }>({})

  // Rows handed to settlement for polling; see `rowTracked`.
  const handedOver = new WeakSet<UploadQueueItem>()

  /*
   * Settlement writes server metadata into a row once. `afterMetadataLoaded`
   * does not pass what was sent; `onAssetRead` of the same read does.
   * Tracks the rows written into, and those whose read is not finished yet.
   */
  const loadedBySettlement = new WeakSet<UploadQueueItem>()
  let loadedInThisRead: UploadQueueItem[] = []

  /*
   * Slot rows for which a 404 of their asset's slots list was already reported.
   * Settlement retries three times before giving up, and only knows "already reported" for assets
   * its own read found missing. The 404 is turned into an answer here, so it is remembered here.
   * Keyed by row, not asset: a report for one upload says nothing about the
   * next upload into that slot. Cleared on the next successful slots read.
   */
  const goneAssetWrittenDown = new WeakSet<UploadQueueItem>()
  /*
   * Errors a slots read threw while it suppressed reporting itself. Settlement starts
   * a failure streak only with a reported failure and would mistake these for one.
   */
  const thrownQuietly = new WeakSet<object>()

  // Only rows a slots read is made for. A row still waiting or uploading
  // has not been polled, and reports before that do not concern it.
  const slotRowsOf = (assetId: DocId) =>
    Object.values(queues.value).flatMap((queue) =>
      queue.items
        .map((item) => toRaw(item))
        .filter(
          (item) => item.type === UploadQueueItemType.SlotFile && item.assetId === assetId && handedOver.has(item)
        )
    )

  // A deleted asset has no slots. The row's file is then missing from a read list,
  // which settlement treats like a nonexistent asset. Anything else is a failed read.
  const readSlotFiles = async (assetId: DocId, options?: UploadReadOptions) => {
    // Snapshot of the rows when the request goes out.
    const rows = slotRowsOf(assetId)
    const writtenDown = rows.length > 0 && rows.every((row) => goneAssetWrittenDown.has(row))
    const report = options?.report === true && !writtenDown
    try {
      const files = await fetchAssetSlotFiles(assetId, { report })
      rows.forEach((row) => goneAssetWrittenDown.delete(row))

      return files
    } catch (error) {
      if (apiErrorStatus(error) !== 404) {
        if (!report && options?.report === true && error instanceof Object) thrownQuietly.add(error)
        throw error
      }
      if (report) rows.forEach((row) => goneAssetWrittenDown.add(row))

      return []
    }
  }

  /*
   * The core handles the queues (two uploads at a time), each row's run, row exit, and settlement after upload.
   * Poll, notifications and the refresh button all go through settlement; notifications only bring news sooner.
   * The admin-dam specific parts passed here are the failed-upload text and alert, the upload and the import.
   */
  const core = createUploadQueueCore(
    adminDamQueuePreset({
      queues,
      settlement: {
        roleOf,
        policyFor,
        matches: (item, target, purpose) =>
          // The metadata notification names no file, so match by asset only.
          purpose === 'metadata'
            ? item.assetId === target.assetId
            : notificationMatches(item, target.assetId, target.fileId, purpose === 'decorate'),
        readers: {
          asset: readAsset,
          assets: readAssets,
          slotFiles: readSlotFiles,
          duplicateOriginFile: fetchDuplicateOriginFile,
          // Reported by the api error logger, which the three readers use. Errors suppressed above do not count.
          failureReported: (error) =>
            !(error instanceof Object && thrownQuietly.has(error)) && apiErrorIsReported(error),
        },
        caches: {
          addAuthors: addToCachedAuthors,
          addKeywords: addToCachedKeywords,
          fetchAuthors: fetchCachedAuthors,
          fetchKeywords: fetchCachedKeywords,
        },
        messages: {
          // The slot row has only Cancel, so its text must not point to a refresh button.
          processingTooLong: (item) =>
            translate(
              item.type === UploadQueueItemType.SlotFile
                ? 'system.uploadErrors.processingTooLongSlot'
                : 'system.uploadErrors.processingTooLong'
            ),
          readFailed: () => translate('system.uploadErrors.metadataFailed'),
          /*
           * Uses its own text: the queue reports a client failure once per text,
           * so sharing that text would hide this failure as already reported.
           */
          assetMissing: () => translate('system.uploadErrors.fileMissing'),
          // Text for an uploaded row without a form whose asset the refresh finds deleted.
          assetGone: () => translate('common.damImage.queueItem.assetGone'),
        },
        // The only failed row the metadata notification still reaches: it failed for lack of this metadata.
        metadataGate: (queueId, item) => (metadataFailures.has(metadataFailureKey(queueId, item)) ? 'load' : undefined),
        hooks: {
          // The file failed, which is now the row's problem, not the missing batch metadata.
          // The core counts the queue and starts the next row after this.
          onRowFinal: (queueId, item) => {
            if (item.status === UploadQueueItemStatus.Failed) metadataFailures.delete(metadataFailureKey(queueId, item))
            /*
             * A slot file ended by the server. If processed, it may have filled in the asset
             * metadata; if failed or duplicate, the detail still holds it as processing.
             * Queue reads report it only here, since the asset read
             * brings only the main file. Notifications report each end.
             */
            const assetId = item.uploadedAssetId ?? item.assetId
            const ended = slotFileEndedAs(item)
            if (item.type === UploadQueueItemType.SlotFile && ended && assetId && item.fileId) {
              useAssetDetailStore().fileStatusOnServer(assetId, item.fileId, ended)
            }
          },
          onAssetRead: (asset) => {
            // Server values of the rows this read loaded; the bulk save sends what differs.
            // Ordered at landing time, because the send time is unknown here.
            const landedAt = nextMetadataOrder()
            loadedInThisRead.forEach((item) => {
              if (item.assetId === asset.id) setQueueRowBaseline(item, baselineOfAsset(asset), landedAt)
            })
            loadedInThisRead = []
            /*
             * Every row read comes here: queue poll, notification read, refresh button.
             * A detail or panel holding the asset with its main file processing learns its
             * progress here, and an empty-created asset learns of its first slot file.
             * Nothing is written into the detail here. Its page re-reads
             * the asset so the form is not older than the file.
             */
            if (asset.mainFile?.fileAttributes) {
              useAssetDetailStore().fileStatusOnServer(
                asset.id,
                asset.mainFile.id,
                asset.mainFile.fileAttributes.status
              )
            }
          },
          /*
           * A mass-edit row's status belongs to its batch load. A processed file clears
           * the row error, except the missing-metadata one, which is cleared elsewhere.
           * For a row whose file had failed, it restores what the failure
           * removed: the form as left, or the earlier missing-metadata text.
           */
          onProcessedSeen: (queueId, item) => {
            if (metadataFailures.has(metadataFailureKey(queueId, item))) return
            item.error.hasError = false
            item.error.message = ''
            // Clear the reason with the error: some rows show it instead of the message.
            item.error.assetFileFailReason = AssetFileFailReason.None
            if (item.status !== UploadQueueItemStatus.Failed) return
            if (leftOutByBatch.has(toRaw(item))) {
              // Still without metadata: the batch-left row that the metadata notification may reach.
              metadataFailures.add(metadataFailureKey(queueId, item))
              item.error.hasError = true
              item.error.message = translate('system.uploadErrors.metadataUnavailable')
              return
            }
            item.status = UploadQueueItemStatus.Uploaded
            // A duplicate is settled read-only.
            if (!item.isDuplicate) item.canEditMetadata = true
          },
          // Also clear the batch load warning: the metadata is here and the row counts as loaded.
          afterMetadataLoaded: (queueId, item) => {
            // Also called for a row that already had metadata; that row keeps what it had.
            if (!loadedBySettlement.has(toRaw(item))) {
              loadedBySettlement.add(toRaw(item))
              loadedInThisRead.push(item)
            }
            leftOutByBatch.delete(toRaw(item))
            if (metadataFailures.delete(metadataFailureKey(queueId, item))) {
              item.error.hasError = false
              item.error.message = ''
              if (item.status === UploadQueueItemStatus.Failed) item.status = UploadQueueItemStatus.Uploaded
            }
          },
        },
        connection: useDamNotificationsConnection(),
      },
      // Imported from `uploadService.ts` so tests that mock that module by path still work.
      upload: useUpload,
      // The import request is the whole run: it never rejects and writes the row itself.
      importRun: (item) => adminDamImportRun(externalProviderImport(item).importInit),
      failureMessage: resolveUploadErrorMessage,
      // Uses the store's own `useAlerts()` so tests that mock `useAlerts` still work.
      alert: (message) => showError(message),
      // From here the queue poll checks this row.
      rowTracked: (_queueId, item) => handedOver.add(toRaw(item)),
      rowRemoved: (queueId, item) => metadataFailures.delete(metadataFailureKey(queueId, item)),
    })
  )

  // Searches from the back. Finished uploads stay in the queue,
  // so the first match is the previous upload into that slot.
  function getQueueItemForSlotItem(queueId: string, slotName: string, assetId: DocId) {
    if (!(queueId in queues.value)) return undefined
    // Not `findLastIndex`: it is ES2023, the target is es2019, and esbuild does not polyfill built-ins.
    const items = queues.value[queueId].items
    let index = -1
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].slotName === slotName && items[i].assetId === assetId) {
        index = i
        break
      }
    }
    if (index === -1) return undefined

    return { item: queues.value[queueId].items[index], index }
  }

  // Actions
  async function addByFiles(queueId: string, files: File[]) {
    const { getDamConfigExtSystem } = useDamConfigState(damClient)
    const { currentAssetLicenceId } = useCurrentAssetLicence()
    const { currentExtSystemId } = useCurrentExtSystem()
    const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
    if (isUndefined(configExtSystem)) {
      throw new Error('Ext system must be initialised.')
    }
    for await (const file of files) {
      const type = getAssetTypeByMimeType(damFileTypeFix(file), configExtSystem)
      if (!type) continue
      const queueItem = createDefault(
        core.uniqueKey('file_' + file.name),
        UploadQueueItemType.File,
        UploadQueueItemStatus.Waiting,
        type,
        UPLOAD_QUEUE_ITEM_CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.file = file
      queueItem.displayTitle = file.name
      core.addRow(queueId, queueItem)
    }
  }

  async function addByFilesAsSlotUpload(
    queueId: string,
    files: File[],
    assetId: DocId,
    slotName: string,
    assetType: DamAssetTypeType
  ) {
    const { currentAssetLicenceId } = useCurrentAssetLicence()
    for await (const file of files) {
      const queueItem = createDefault(
        core.uniqueKey('file_' + file.name),
        UploadQueueItemType.SlotFile,
        UploadQueueItemStatus.Waiting,
        assetType,
        UPLOAD_QUEUE_ITEM_CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.file = file
      queueItem.displayTitle = file.name
      queueItem.assetId = assetId
      queueItem.slotName = slotName
      core.addRow(queueId, queueItem)
    }
  }

  async function addByAssets(queueId: string, assets: AssetSearchListItemDto[]) {
    const { currentAssetLicenceId } = useCurrentAssetLicence()
    const assetIds: DocId[] = []
    for await (const asset of assets) {
      assetIds.push(asset.id)
      const queueItem = createDefault(
        'asset_' + asset.id,
        UploadQueueItemType.Asset,
        UploadQueueItemStatus.Loading,
        asset.attributes.assetType,
        UPLOAD_QUEUE_ITEM_CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.assetStatus = asset.attributes.assetStatus
      queueItem.displayTitle = asset.texts.displayTitle
      queueItem.assetId = asset.id
      queueItem.fileId = asset.mainFile ? asset.mainFile.id : null
      // Without this the queue form switch shows `true` as off, and the user has to toggle it twice.
      queueItem.mainFileSingleUse = asset.mainFileSingleUse
      queueItem.imagePreview = asset.mainFile && asset.mainFile.links ? asset.mainFile.links.image_list : undefined
      core.addRow(queueId, queueItem)
    }
    // Fire-and-forget. Without this catch a rejection leaves every fetched item on `Loading`.
    fetchLazyAdditionalMetadata(queueId, currentAssetLicenceId.value, assetIds).catch((error) => {
      console.error('uploadQueue: additional metadata could not be loaded', error)
      failStillLoading(queueId, assetIds)
    })
  }

  // An asset missing from the response would otherwise stay on `Loading` forever.
  function failStillLoading(queueId: string, assetIds: DocId[]) {
    if (!(queueId in queues.value)) return
    queues.value[queueId].items.forEach((item) => {
      if (item.status !== UploadQueueItemStatus.Loading) return
      if (isNull(item.assetId) || !assetIds.includes(item.assetId)) return
      // The notification already gave this row its metadata and form, so it has what this batch did not bring.
      if (item.canEditMetadata) {
        item.status = UploadQueueItemStatus.Uploaded
        return
      }
      metadataFailures.add(metadataFailureKey(queueId, item))
      leftOutByBatch.add(toRaw(item))
      item.status = UploadQueueItemStatus.Failed
      item.error.hasError = true
      // Own message: this row was never uploaded and has no refresh button to point to.
      item.error.message = translate('system.uploadErrors.metadataUnavailable')
    })
    core.recalculateQueueCounts(queueId)
  }

  async function addByExternalProviderAsset(
    queueId: string,
    assets: AssetExternalProviderListDto[],
    importAsset = false
  ) {
    const { currentAssetLicenceId } = useCurrentAssetLicence()
    const { activeExternalProvider } = useExternalProviders()
    for await (const asset of assets) {
      const queueItem = createDefault(
        core.uniqueKey('externalProviderAsset_' + asset.id),
        UploadQueueItemType.ExternalProviderAsset,
        importAsset ? UploadQueueItemStatus.Waiting : UploadQueueItemStatus.Uploaded,
        asset.attributes.assetType,
        UPLOAD_QUEUE_ITEM_CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.assetStatus = DamAssetStatus.WithFile
      queueItem.displayTitle = asset.texts.displayTitle
      queueItem.externalProviderAssetId = asset.id
      queueItem.externalProviderName = activeExternalProvider.value
      queueItem.externalProviderMetadata = asset.metadata
      queueItem.imagePreview = {
        width: 0,
        height: 0,
        requestedWidth: 0,
        requestedHeight: 0,
        url: asset.url,
        title: '',
        type: AssetFileLinkType.Image,
      }
      core.addRow(queueId, queueItem)
    }
  }

  async function fetchLazyAdditionalMetadata(queueId: string, licenceId: number, assetIds: DocId[]) {
    const { getAuthorConflicts } = useAssetSuggestions()
    // Order of this read among metadata reads and saves, taken when sent.
    // Anything a row receives after this point is newer than this read's answer.
    const sentAt = nextMetadataOrder()
    // Sent while a save of the asset is in flight: the answer may be from before or after the save.
    const sentDuringSave = assetIds.filter(metadataSaveOnItsWay)
    const res = await fetchAssetListByIds(assetIds, licenceId)
    for (let i = 0; i < res.length; i++) {
      const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === res[i].id)
      if (foundIndex > -1 && metadataMayStillChange(res[i])) {
        /*
         * No form yet: saving before the server processes the file would overwrite what the server fills in from it.
         * The metadata notification brings the form to the uploader.
         * Others select the asset again once it is processed.
         */
        const item = queues.value[queueId].items[foundIndex]
        // Already settled by a newer answer, such as a later batch. That one stands.
        if (item.status !== UploadQueueItemStatus.Loading) continue
        // The notification gave it metadata and form before this answer. That is newer, so it keeps it.
        if (item.canEditMetadata) {
          item.status = UploadQueueItemStatus.Uploaded
          continue
        }
        metadataFailures.add(metadataFailureKey(queueId, item))
        leftOutByBatch.add(toRaw(item))
        item.status = UploadQueueItemStatus.Failed
        item.error.hasError = true
        item.error.message = translate('system.uploadErrors.assetFileStillProcessing')
      } else if (foundIndex > -1) {
        // The form already exists, from the notification, a save or another batch.
        // It takes this answer only if the answer is newer than its last data and nobody changed the row since.
        // Otherwise, or if that is unknown, it keeps what it has.
        if (
          queues.value[queueId].items[foundIndex].canEditMetadata &&
          !queueRowTakesAnswer(queues.value[queueId].items[foundIndex], sentAt)
        ) {
          queues.value[queueId].items[foundIndex].status = UploadQueueItemStatus.Uploaded
          continue
        }
        leftOutByBatch.delete(toRaw(queues.value[queueId].items[foundIndex]))
        // A row without its form may hold data a detail or panel save wrote after this read was sent.
        // That is newer than this answer, so it keeps it and only gets its form.
        if (!queueRowGivenSince(queues.value[queueId].items[foundIndex], sentAt)) {
          queues.value[queueId].items[foundIndex].keywords = res[i].keywords
          queues.value[queueId].items[foundIndex].authors = res[i].authors
          queues.value[queueId].items[foundIndex].customData = res[i].metadata.customData
          queues.value[queueId].items[foundIndex].mainFileSingleUse = res[i].mainFileSingleUse
          setQueueRowBaseline(queues.value[queueId].items[foundIndex], baselineOfAsset(res[i]), sentAt)
          queues.value[queueId].items[foundIndex].authorConflicts = getAuthorConflicts(
            res[i].metadata.authorSuggestions
          )
        }
        queues.value[queueId].items[foundIndex].status = UploadQueueItemStatus.Uploaded
        queues.value[queueId].items[foundIndex].canEditMetadata = true
        // Clear the warning an earlier batch left: the missing metadata has arrived.
        if (metadataFailures.delete(metadataFailureKey(queueId, queues.value[queueId].items[foundIndex]))) {
          queues.value[queueId].items[foundIndex].error.hasError = false
          queues.value[queueId].items[foundIndex].error.message = ''
        }
        addToCachedAuthors(queues.value[queueId].items[foundIndex].authors)
        // Cache author conflicts too, as the detail does, so their chips show names.
        addToCachedAuthors(queues.value[queueId].items[foundIndex].authorConflicts)
      }
    }
    failStillLoading(queueId, assetIds)
    fetchCachedAuthors()
    // Also update a detail or panel holding one of these assets while its main file is still in flight.
    const assetDetailStore = useAssetDetailStore()
    res.forEach((asset) => assetDetailStore.mainFileOfRead(asset))
    /*
     * The rules above still apply. After that save is answered the asset is read again,
     * so an unchanged row gets the server's latest data, including other editors' saves.
     */
    sentDuringSave.forEach((assetId) => afterMetadataSaves(assetId, () => readAgain(queueId, licenceId, assetId)))
  }

  function readAgain(queueId: string, licenceId: number, assetId: DocId) {
    // Skip if the row was removed meanwhile.
    if (!queues.value[queueId]?.items.some((item) => item.assetId === assetId)) return
    fetchLazyAdditionalMetadata(queueId, licenceId, [assetId]).catch((error) => {
      console.error('uploadQueue: additional metadata could not be read again', error)
      failStillLoading(queueId, [assetId])
    })
  }

  async function removeByAssetId(queueId: string, assetId: DocId) {
    if (!(queueId in queues.value)) return
    const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === assetId)
    if (foundIndex === -1) {
      core.recalculateQueueCounts(queueId)

      return
    }
    /*
     * Use the same teardown, not a bare splice. Delete is offered while the upload still runs
     * (the metadata event arrives after the first chunk), and a splice would keep posting chunks.
     */
    await removeByIndex(queueId, foundIndex)
  }

  async function removeByIndex(queueId: string, index: number) {
    core.removeByIndex(queueId, index)
  }

  /*
   * Each row goes through the same teardown, so a running upload is stopped and its in-flight chunk aborted.
   * Iterates from the back so removals do not shift rows still to be checked.
   */
  function removeAllByAssetId(queueId: string, assetId: DocId) {
    if (!(queueId in queues.value)) return
    const items = queues.value[queueId].items
    for (let index = items.length - 1; index >= 0; index--) {
      if (items[index].assetId === assetId) core.removeByIndex(queueId, index)
    }
  }

  /*
   * A deleted asset loses its rows in the mass edit and upload queues.
   * Otherwise their bin would delete it again and their form or bulk save would send metadata to it.
   * Slot uploads are not removed, as their rows offer none of that.
   */
  function removeRowsOfDeletedAsset(assetId: DocId) {
    removeAllByAssetId(QUEUE_ID_MASS_EDIT, assetId)
    removeAllByAssetId(QUEUE_ID_UPLOAD_GLOBAL, assetId)
  }

  async function removeByExternalProviderAssetId(queueId: string, assetId: AssetExternalProviderId) {
    if (queueId in queues.value) {
      const foundIndex = queues.value[queueId].items.findIndex((item) => item.externalProviderAssetId === assetId)
      if (foundIndex > -1) queues.value[queueId].items.splice(foundIndex, 1)
      core.recalculateQueueCounts(queueId)
    }
  }

  async function stopItemUpload(queueId: string, queueItem: UploadQueueItem) {
    core.stopItemUpload(queueId, queueItem)
  }

  /*
   * Slot uploads of one asset differ only by file, so news naming only the asset would settle all of them.
   * A mass-edit row without a file id is equally ambiguous, so `matchAssetWithoutFile` matches only a processed file.
   * That only completes the row. A failure or duplicate would give it an unearned terminal state.
   */
  function notificationMatches(
    item: UploadQueueItem,
    assetId: DocId,
    fileId: DocIdNullable,
    matchAssetWithoutFile = false
  ) {
    if (item.assetId !== assetId) return false
    /*
     * Not while the batch load owns the row. Off `Loading`, the batch failure handler skips it,
     * and the row looks finished without metadata, which the bulk save skips.
     */
    if (item.status === UploadQueueItemStatus.Loading) return false
    /*
     * A slot matches only news naming its own file: its notification, or the slot list the poll reads.
     * A read of the asset covers only the main file.
     */
    if (item.type === UploadQueueItemType.SlotFile) return !isNull(fileId) && item.fileId === fileId
    if (item.type === UploadQueueItemType.Asset && isNull(item.fileId)) return matchAssetWithoutFile

    return isNull(fileId) || item.fileId === fileId
  }

  // Old names kept for the app's notification listeners.

  function queueItemProcessed(assetId: DocId, fileId: DocIdNullable = null) {
    return core.settlement.notify({ kind: 'processed', assetId, fileId })
  }

  function queueItemFailed(assetId: DocId, failReason: AssetFileFailReasonType, fileId: DocIdNullable = null) {
    core.settlement.settleKnownFailed({ assetId, fileId }, failReason)
  }

  function queueItemMetadataProcessed(assetId: DocId) {
    return core.settlement.notify({ kind: 'metadata', assetId, fileId: null })
  }

  function queueItemDuplicate(
    assetId: DocId,
    originAssetFile: DocIdNullable = null,
    assetType: DamAssetTypeType | null = null,
    fileId: DocIdNullable = null
  ) {
    return core.settlement.settleKnownDuplicate({ assetId, fileId }, originAssetFile, assetType)
  }

  /*
   * Row refresh button: checks the file's current state and settles the asset's rows holding this file.
   * Never for a slot upload: the asset does not say which slots finished.
   */
  function refreshQueueItem(item: UploadQueueItem): Promise<UploadRefreshOutcome> {
    if (isNull(item.assetId)) return Promise.resolve('error')

    return core.settlement.refreshAsset({ assetId: item.assetId, fileId: item.fileId })
  }

  function queueItemsReplaceEmptyCustomDataValue(
    queueId: string,
    data: { assetType: DamAssetTypeType; elementProperty: string; value: CustomDataValue },
    forceReplace = false
  ) {
    uploadQueueFillCustomDataValue(queues.value[queueId].items, data, forceReplace)
  }

  /*
   * Keywords and authors go only to items whose asset type enables them, like custom values per type.
   * Other rows have no input for them, and the bulk save would send them.
   */
  function assetTypeHas(feature: 'keywords' | 'authors') {
    const { getDamConfigExtSystem } = useDamConfigState(damClient)
    const { currentExtSystemId } = useCurrentExtSystem()
    const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)

    return (item: UploadQueueItem) => !!configExtSystem?.[item.assetType]?.[feature]?.enabled
  }

  function queueItemsReplaceEmptyKeywords(queueId: string, value: string[], forceReplace = false) {
    uploadQueueFillKeywords(queues.value[queueId].items, value, forceReplace, assetTypeHas('keywords'))
  }

  function queueItemsReplaceEmptyAuthors(queueId: string, value: string[], forceReplace = false) {
    uploadQueueFillAuthors(queues.value[queueId].items, value, forceReplace, assetTypeHas('authors'))
  }

  function updateAssetMetadata(asset: AssetDetailItemDto) {
    // Called when the detail or panel save is answered, so the order is taken here.
    const savedAt = nextMetadataOrder()
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === asset.id) {
          // A separate copy per row: mass operations mutate custom data of their queue's rows in place
          // and would otherwise write into rows of another queue.
          const saved = cloneDeep(baselineOfAsset(asset))
          item.keywords = saved.keywords
          item.authors = saved.authors
          item.customData = saved.customData
          item.mainFileSingleUse = saved.mainFileSingleUse
          // The server's current state of the row. That save marks the asset described; the local flag predates it.
          setQueueRowBaseline(item, { ...saved, described: true }, savedAt)
        }
      })
    }
  }

  function reset() {
    Object.keys(queues.value).forEach((queueId) => core.settlement.dropQueue(queueId))
    queues.value = {}
    metadataFailures.clear()
  }

  return {
    queues,
    getQueueFileInputKey: core.getQueueFileInputKey,
    getQueue: core.getQueue,
    getQueueItems: core.getQueueItems,
    getQueueItemsByStatus: core.getQueueItemsByStatus,
    getQueueTotalCount: core.getQueueTotalCount,
    getQueueProcessedCount: core.getQueueProcessedCount,
    getQueueItemForSlotItem,
    getQueueItemsTypes: core.getQueueItemsTypes,
    addByFiles,
    addByFilesAsSlotUpload,
    addByAssets,
    addByExternalProviderAsset,
    forceReloadFileInput: core.forceReloadFileInput,
    fetchLazyAdditionalMetadata,
    removeByAssetId,
    removeRowsOfDeletedAsset,
    removeByIndex,
    removeByExternalProviderAssetId,
    createQueue: core.createQueue,
    addQueueItem: core.addQueueItem,
    processUpload: core.processUpload,
    stopUpload: core.stopUpload,
    stopItemUpload,
    queueItemUploadStart: core.queueItemUploadStart,
    queueItemProcessed,
    queueItemFailed,
    queueItemMetadataProcessed,
    queueItemDuplicate,
    refreshQueueItem,
    setUploadSpeed: core.setUploadSpeed,
    recalculateQueueCounts: core.recalculateQueueCounts,
    clearQueue: core.clearQueue,
    queueItemsReplaceEmptyCustomDataValue,
    queueItemsReplaceEmptyKeywords,
    queueItemsReplaceEmptyAuthors,
    updateAssetMetadata,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadQueuesStore, import.meta.hot))
}
