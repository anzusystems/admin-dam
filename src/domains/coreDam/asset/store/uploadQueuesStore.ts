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
  baselineOfAsset,
  nextMetadataOrder,
  queueRowGivenSince,
  queueRowTakesAnswer,
  setQueueRowBaseline,
} from '@/domains/coreDam/shared/services/upload/queueRowBaseline'
import { resolveUploadErrorMessage, useUpload } from '@/domains/coreDam/shared/services/upload/uploadService'
import { i18n } from '@/plugins/i18n'
import { damClient } from '@/shared/apiClients/damClient'

// Outside a component, so the global instance - the same way `uploadService` reaches it.
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

/* What the settlement does with a row, by its role. The state of a processed file is written from its notification
 * at once, and the read after it completes the row; a duplicate stays the row it was, marked. */
const policyFor = (role: UploadRowRoleType): UploadSettlePolicy => {
  switch (role) {
    // The asset speaks only of its main file, so a slot is read from the list of the slots; it has no form.
    case UploadRowRole.Slot:
      return { reader: 'slots', settleOn: 'event', duplicate: 'markDuplicate', metadata: 'none' }
    // Never asked about: the batch load owns its status, and a processed file only completes the row.
    case UploadRowRole.MassEdit:
      return { reader: 'none', settleOn: 'never', duplicate: 'markDuplicate', metadata: 'load' }
    default:
      return { reader: 'asset', settleOn: 'event', duplicate: 'markDuplicate', metadata: 'load' }
  }
}

/* The poll asks for as long as a row waits. The settlement says of each of its requests whether a failure of it is
 * the first of a streak, and only that one is handed to the api error logger: `report` of the three readers. */

// An asset that does not exist is an answer, which the settlement counts; anything else is a read that failed.
const readAsset = async (assetId: DocId, options?: UploadReadOptions) => {
  try {
    // Called as ever unless it is to be quiet.
    return options?.report === false ? await fetchAsset(assetId, { report: false }) : await fetchAsset(assetId)
  } catch (error) {
    if (apiErrorStatus(error) === 404) return null
    throw error
  }
}

// The read of several assets, and the read of the slots below, report only where they are told to.
const readAssets = (licenceId: number, assetIds: DocId[], options?: UploadReadOptions) =>
  fetchWaitingAssets(assetIds, licenceId, { report: options?.report === true })

// A file the server has not processed yet: it may still fill in the metadata of an asset that is not described.
const STILL_PROCESSING: AssetFileProcessStatusType[] = [
  AssetFileProcessStatus.Uploading,
  AssetFileProcessStatus.Uploaded,
  AssetFileProcessStatus.Stored,
]

/* The server may yet fill in its metadata from the file: a form loaded now would overwrite that when saved. The
 * mass edit, the detail and the panel of the list go by it alike. */
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

export const useUploadQueuesStore = defineStore('damUploadQueuesStore', () => {
  // The mass-edit rows whose batch load could not give them their metadata - not by message, which changes with the
  // language.
  const metadataFailures = new Set<string>()
  const metadataFailureKey = (queueId: string, item: UploadQueueItem) => queueId + '/' + item.key
  // The mass-edit rows its batch load left without their metadata, whatever became of their file since: their form
  // is empty, and the bulk save would send that.
  const leftOutByBatch = new WeakSet<UploadQueueItem>()

  const { createDefault } = useUploadQueueItemFactory()
  const { showError } = useAlerts()
  const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
  const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

  const queues = ref<{ [queueId: string]: UploadQueue }>({})

  // The rows handed to the settlement to be asked about: `rowTracked` below.
  const handedOver = new WeakSet<UploadQueueItem>()

  /* The settlement writes the metadata of the server into a row once, and `afterMetadataLoaded` tells of it without
   * saying what the server sent; `onAssetRead` of the same read does. The rows it has written into, and those of
   * them whose read is not over yet. */
  const loadedBySettlement = new WeakSet<UploadQueueItem>()
  let loadedInThisRead: UploadQueueItem[] = []

  /* The slot rows for which a 404 of the list of the slots of their asset was written down. The settlement asks
   * three times before it gives such a row up, and knows "already written down" only of an asset its own read found
   * missing: here the 404 is turned into an answer, so this is where it is remembered. By the row and not by the
   * asset: what was written down for one upload says nothing of the next one into that slot, and the memory goes
   * with the row. Forgotten with the next read of the slots that answers. */
  const goneAssetWrittenDown = new WeakSet<UploadQueueItem>()

  // Only the rows a read of the slots is made for: one that still waits or is still being sent has not been asked
  // about, and what is written down before it is has nothing to do with it.
  const slotRowsOf = (assetId: DocId) =>
    Object.values(queues.value).flatMap((queue) =>
      queue.items
        .map((item) => toRaw(item))
        .filter(
          (item) => item.type === UploadQueueItemType.SlotFile && item.assetId === assetId && handedOver.has(item)
        )
    )

  // An asset that is gone has no slots: the file of the row is then missing from a list that was read, which the
  // settlement counts as it counts an asset that does not exist. Anything else is a read that failed.
  const readSlotFiles = async (assetId: DocId, options?: UploadReadOptions) => {
    // The rows as they are when the request goes out.
    const rows = slotRowsOf(assetId)
    const writtenDown = rows.length > 0 && rows.every((row) => goneAssetWrittenDown.has(row))
    const report = options?.report === true && !writtenDown
    try {
      const files = await fetchAssetSlotFiles(assetId, { report })
      rows.forEach((row) => goneAssetWrittenDown.delete(row))

      return files
    } catch (error) {
      if (apiErrorStatus(error) !== 404) throw error
      if (report) rows.forEach((row) => goneAssetWrittenDown.add(row))

      return []
    }
  }

  /* The queues, two uploads at a time, the run of each row, how a row leaves, and what becomes of a row once its
   * file is with the server: the poll of its queue, the notifications and the refresh button all go through the
   * settlement; the notifications only bring the news sooner. What the core is given here is admin-dam's own, and
   * it calls it: the text and the alert of a failed upload, the upload and the import. */
  const core = createUploadQueueCore(
    adminDamQueuePreset({
      queues,
      settlement: {
        roleOf,
        policyFor,
        matches: (item, target, purpose) =>
          // The metadata notification names no file: by the asset alone.
          purpose === 'metadata'
            ? item.assetId === target.assetId
            : notificationMatches(item, target.assetId, target.fileId, purpose === 'decorate'),
        readers: {
          asset: readAsset,
          assets: readAssets,
          slotFiles: readSlotFiles,
          duplicateOriginFile: fetchDuplicateOriginFile,
        },
        caches: {
          addAuthors: addToCachedAuthors,
          addKeywords: addToCachedKeywords,
          fetchAuthors: fetchCachedAuthors,
          fetchKeywords: fetchCachedKeywords,
        },
        messages: {
          // The slot row has only Cancel, so it must not be sent looking for a refresh button.
          processingTooLong: (item) =>
            translate(
              item.type === UploadQueueItemType.SlotFile
                ? 'system.uploadErrors.processingTooLongSlot'
                : 'system.uploadErrors.processingTooLong'
            ),
          readFailed: () => translate('system.uploadErrors.metadataFailed'),
          assetMissing: () => translate('system.uploadErrors.unknownError'),
        },
        // The one failed row the metadata notification still reaches: it failed for want of this very metadata.
        metadataGate: (queueId, item) => (metadataFailures.has(metadataFailureKey(queueId, item)) ? 'load' : undefined),
        hooks: {
          // Its file failed: that is what is wrong with the row now, not the metadata its batch load left out. The
          // core counts the queue and starts the next row after this.
          onRowFinal: (queueId, item) => {
            if (item.status === UploadQueueItemStatus.Failed) metadataFailures.delete(metadataFailureKey(queueId, item))
          },
          // An asset created empty gets its first file through a slot: the open detail of it learns its main file.
          onAssetRead: (asset) => {
            // What the server has of the rows this read loaded: the bulk save sends what differs from it. Placed
            // where the read lands, when it was sent not being known here.
            const landedAt = nextMetadataOrder()
            loadedInThisRead.forEach((item) => {
              if (item.assetId === asset.id) setQueueRowBaseline(item, baselineOfAsset(asset), landedAt)
            })
            loadedInThisRead = []
            const assetDetailStore = useAssetDetailStore()
            if (assetDetailStore.asset?.id === asset.id && assetDetailStore.asset.mainFile === null && asset.mainFile) {
              assetDetailStore.asset.mainFile = asset.mainFile
            }
            /* Every read made for a row comes here - the poll of a queue, the read a notification asks for, the
             * refresh button: a detail or a panel that holds the asset with its main file still on its way learns
             * here that the server has processed it. */
            if (asset.mainFile?.fileAttributes?.status === AssetFileProcessStatus.Processed) {
              assetDetailStore.mainFileProcessed(asset.id, asset.mainFile.id)
            }
          },
          /* The status of a mass-edit row is its batch load's. A processed file takes the error of the row away - not
           * the missing-metadata one, which is still true and cleared where it stops being - and gives a row whose
           * file had failed back what the failure took: the form, as the user left it, or the missing-metadata text
           * it had before. */
          onProcessedSeen: (queueId, item) => {
            if (metadataFailures.has(metadataFailureKey(queueId, item))) return
            item.error.hasError = false
            item.error.message = ''
            // The reason goes with the error: some rows print it in place of the message.
            item.error.assetFileFailReason = AssetFileFailReason.None
            if (item.status !== UploadQueueItemStatus.Failed) return
            if (leftOutByBatch.has(toRaw(item))) {
              // Still without its metadata: the row its batch load left, which the metadata notification may reach.
              metadataFailures.add(metadataFailureKey(queueId, item))
              item.error.hasError = true
              item.error.message = translate('system.uploadErrors.metadataUnavailable')
              return
            }
            item.status = UploadQueueItemStatus.Uploaded
            // A duplicate is settled read-only.
            if (!item.isDuplicate) item.canEditMetadata = true
          },
          // And the warning its batch load left behind: the metadata is here now, and the row is a loaded one.
          afterMetadataLoaded: (queueId, item) => {
            // Called for a row that had its metadata already as well: that one kept what it held.
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
      // From `uploadService.ts`, so the tests that replace that module by its path still do.
      upload: useUpload,
      // The import request is all there is: it never rejects and writes the row itself.
      importRun: (item) => adminDamImportRun(externalProviderImport(item).importInit),
      failureMessage: resolveUploadErrorMessage,
      // Of the store's own `useAlerts()`, so the tests that replace `useAlerts` still do.
      alert: (message) => showError(message),
      // From here the poll of the queue asks about the row.
      rowTracked: (_queueId, item) => handedOver.add(toRaw(item)),
      rowRemoved: (queueId, item) => metadataFailures.delete(metadataFailureKey(queueId, item)),
    })
  )

  // From the back: finished uploads stay in the queue, so the first match was the previous upload into that slot.
  function getQueueItemForSlotItem(queueId: string, slotName: string, assetId: DocId) {
    if (!(queueId in queues.value)) return undefined
    // `findLastIndex` is ES2023 against an es2019 target, and esbuild leaves built-ins alone.
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
      // Or the switch in the queue form shows a `true` as off, and the user has to toggle it twice.
      queueItem.mainFileSingleUse = asset.mainFileSingleUse
      queueItem.imagePreview = asset.mainFile && asset.mainFile.links ? asset.mainFile.links.image_list : undefined
      core.addRow(queueId, queueItem)
    }
    // Fire-and-forget: without this catch a rejection left every item it fetched on `Loading`.
    fetchLazyAdditionalMetadata(queueId, currentAssetLicenceId.value, assetIds).catch((error) => {
      console.error('uploadQueue: additional metadata could not be loaded', error)
      failStillLoading(queueId, assetIds)
    })
  }

  // An asset the response did not carry would otherwise sit on `Loading` with no way back.
  function failStillLoading(queueId: string, assetIds: DocId[]) {
    if (!(queueId in queues.value)) return
    queues.value[queueId].items.forEach((item) => {
      if (item.status !== UploadQueueItemStatus.Loading) return
      if (isNull(item.assetId) || !assetIds.includes(item.assetId)) return
      // Given its metadata and its form by the notification meanwhile: it has what this batch did not bring.
      if (item.canEditMetadata) {
        item.status = UploadQueueItemStatus.Uploaded
        return
      }
      metadataFailures.add(metadataFailureKey(queueId, item))
      leftOutByBatch.add(toRaw(item))
      item.status = UploadQueueItemStatus.Failed
      item.error.hasError = true
      // Its own wording: this row was never uploaded and has no refresh button to be sent to.
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
    // Its place among the reads and the saves of metadata, taken as it is sent: what a row is given from here on
    // is newer than the answer of this read.
    const sentAt = nextMetadataOrder()
    const res = await fetchAssetListByIds(assetIds, licenceId)
    for (let i = 0; i < res.length; i++) {
      const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === res[i].id)
      if (foundIndex > -1 && metadataMayStillChange(res[i])) {
        /* No form for it yet: saved before the server has processed its file, it would overwrite what the server fills
         * in from the file. The metadata notification brings the form to the one who uploaded it; anyone else selects
         * it again once it is processed. */
        const item = queues.value[queueId].items[foundIndex]
        // Settled by a newer answer meanwhile - a later batch of it: that one stands.
        if (item.status !== UploadQueueItemStatus.Loading) continue
        // Given its metadata and its form by the notification before this answer came: the newer word, which it keeps.
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
        // Its form is there already, from the notification, a save or another batch. It takes this answer only when
        // that is newer than what it was last given and nobody changed the row since; otherwise it keeps what it
        // holds, and so does a row of which that is not known.
        if (
          queues.value[queueId].items[foundIndex].canEditMetadata &&
          !queueRowTakesAnswer(queues.value[queueId].items[foundIndex], sentAt)
        ) {
          queues.value[queueId].items[foundIndex].status = UploadQueueItemStatus.Uploaded
          continue
        }
        leftOutByBatch.delete(toRaw(queues.value[queueId].items[foundIndex]))
        // A row still without its form can hold what a save from the detail or the panel wrote into it after this
        // read was sent: that is newer than this answer, which may be from before the save. It keeps it, and is
        // only given its form.
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
        // And the warning an earlier batch left behind: the metadata it complained about is here.
        if (metadataFailures.delete(metadataFailureKey(queueId, queues.value[queueId].items[foundIndex]))) {
          queues.value[queueId].items[foundIndex].error.hasError = false
          queues.value[queueId].items[foundIndex].error.message = ''
        }
        addToCachedAuthors(queues.value[queueId].items[foundIndex].authors)
        // And its author conflicts, as the detail does: their chips show the names too.
        addToCachedAuthors(queues.value[queueId].items[foundIndex].authorConflicts)
      }
    }
    failStillLoading(queueId, assetIds)
    fetchCachedAuthors()
  }

  async function removeByAssetId(queueId: string, assetId: DocId) {
    if (!(queueId in queues.value)) return
    const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === assetId)
    if (foundIndex === -1) {
      core.recalculateQueueCounts(queueId)

      return
    }
    /* Through the same teardown, not a bare splice: Delete is offered while the upload still runs
     * (the metadata event arrives after the first chunk), and it would have kept posting chunks. */
    await removeByIndex(queueId, foundIndex)
  }

  async function removeByIndex(queueId: string, index: number) {
    core.removeByIndex(queueId, index)
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

  /* Slot uploads of one asset differ only in the file, so news naming the asset alone settled
   * all of them. A mass-edit row without a file id cannot be told from one either, so only a
   * processed file is matched with `matchAssetWithoutFile` - it merely completes such a row, while a
   * failure or a duplicate would give it a terminal state it has not earned. */
  function notificationMatches(
    item: UploadQueueItem,
    assetId: DocId,
    fileId: DocIdNullable,
    matchAssetWithoutFile = false
  ) {
    if (item.assetId !== assetId) return false
    /* Never while the batch load owns the row: off `Loading` its own failure handler passes it by,
     * and the row is left looking finished with no metadata, which the bulk save skips. */
    if (item.status === UploadQueueItemStatus.Loading) return false
    /* A slot answers only to news naming its own file: its notification, or the list of the slots of its asset
     * the poll reads. A read of the asset speaks of the main file alone. */
    if (item.type === UploadQueueItemType.SlotFile) return !isNull(fileId) && item.fileId === fileId
    if (item.type === UploadQueueItemType.Asset && isNull(item.fileId)) return matchAssetWithoutFile

    return isNull(fileId) || item.fileId === fileId
  }

  // The names of before the settlement, kept for their callers: the notification listeners of the application.

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

  /* The refresh button of a row: asks what became of the file now, and settles by it the rows of the asset that
   * hold the file of this row. Never a slot upload: the asset says nothing about which of its slots finished. */
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

  /* Keywords and authors go only into the items whose asset type has them enabled, as a custom value goes only
   * into the items of its type: the row of another item has no input for them, and the bulk save would send them. */
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
    // Placed where the save of the detail or the panel is answered, which is when this is called.
    const savedAt = nextMetadataOrder()
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === asset.id) {
          // Copies of its own for each row: a mass operation writes into the custom data of the rows of its queue in
          // place, and would write into the row of another queue with them.
          const saved = cloneDeep(baselineOfAsset(asset))
          item.keywords = saved.keywords
          item.authors = saved.authors
          item.customData = saved.customData
          item.mainFileSingleUse = saved.mainFileSingleUse
          // What the server has of the row now. That save marks the asset described; the flag on the asset here is
          // from before it.
          setQueueRowBaseline(item, { ...saved, described: true }, savedAt)
        }
      })
    }
  }

  function reset() {
    Object.keys(queues.value).forEach((queueId) => core.settlement.dropQueue(queueId))
    queues.value = {}
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
