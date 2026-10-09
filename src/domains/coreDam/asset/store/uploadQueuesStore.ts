import {
  AssetFileFailReason,
  AssetFileLinkType,
  DamAssetStatus,
  DamAssetType,
  UploadQueueItemStatus,
  UploadQueueItemType,
  UploadRowRole,
  apiErrorStatus,
  createUploadSettlement,
  damFileTypeFix,
  getAssetTypeByMimeType,
  isNull,
  isUndefined,
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
  AssetSearchListItemDto,
  CustomDataValue,
  DamAssetTypeType,
  DocId,
  DocIdNullable,
  UploadQueue,
  UploadQueueItem,
  UploadQueueItemStatusType,
  UploadReadOptions,
  UploadRefreshOutcome,
  UploadRowRoleType,
  UploadSettlePolicy,
} from '@anzusystems/common-admin'
import { isAxiosError } from 'axios'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { getCurrentScope, onScopeDispose, ref, toRaw } from 'vue'

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
  resolveUploadErrorMessage,
  uploadStop,
  useUpload,
} from '@/domains/coreDam/shared/services/upload/uploadService'
import { i18n } from '@/plugins/i18n'
import { damClient } from '@/shared/apiClients/damClient'
const QUEUE_MAX_PARALLEL_UPLOADS = 2

// The axios cancel token reaches only a request on the wire, not the gaps between chunks.
const uploadStopHandles = new WeakMap<UploadQueueItem, () => void>()

// Outside a component, so the global instance - the same way `uploadService` reaches it.
const translate = (key: string) => {
  const { t } = i18n.global

  return t(key)
}

// A file name is not unique, and a duplicate `:key` lets Vue's keyed diff patch the wrong tile.
let queueItemSequence = 0
const uniqueQueueItemKey = (prefix: string) => `${prefix}_${++queueItemSequence}`
const CHUNK_SIZE = 10485760

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

/* The server answered the request, and refused it (a 4xx): nothing more will come of that request. A request that
 * got no answer, or the answer of a server in trouble, may have been carried out all the same. The requests of an
 * upload go to the client itself, so their failure is the client's own error; one made through the api helpers
 * carries its status otherwise. */
const isRefusal = (error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : apiErrorStatus(error)

  return status !== undefined && status >= 400 && status < 500
}

// Waiting for its turn, being sent, or with the server: not settled yet, one way or the other.
const isUnderWay = (status: UploadQueueItemStatusType) =>
  status === UploadQueueItemStatus.Waiting ||
  status === UploadQueueItemStatus.Uploading ||
  status === UploadQueueItemStatus.Processing

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

  const { createDefault } = useUploadQueueItemFactory()
  const { showError } = useAlerts()
  const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
  const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

  const queues = ref<{ [queueId: string]: UploadQueue }>({})

  // The rows handed to the settlement to be asked about: `track` below.
  const handedOver = new WeakSet<UploadQueueItem>()

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

  /* What becomes of a row once its file is with the server. The poll of its queue, the notifications and the
   * refresh button all go through here; the notifications only bring the news sooner. */
  const settlement = createUploadSettlement({
    queues: () => Object.entries(queues.value),
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
      onRowFinal: (queueId, item) => {
        // Its file failed: that is what is wrong with the row now, not the metadata its batch load left out.
        if (item.status === UploadQueueItemStatus.Failed) metadataFailures.delete(metadataFailureKey(queueId, item))
        recalculateQueueCounts(queueId)
        processUpload(queueId)
      },
      // An asset created empty gets its first file through a slot: the open detail of it learns its main file.
      onAssetRead: (asset) => {
        const assetDetailStore = useAssetDetailStore()
        if (assetDetailStore.asset?.id === asset.id && assetDetailStore.asset.mainFile === null && asset.mainFile) {
          assetDetailStore.asset.mainFile = asset.mainFile
        }
      },
      /* The status of a mass-edit row is its batch load's, so a processed file leaves it alone and only takes the
       * error of the row away. Not the missing-metadata one: it is still true, and cleared where it stops being. */
      onProcessedSeen: (queueId, item) => {
        if (metadataFailures.has(metadataFailureKey(queueId, item))) return
        item.error.hasError = false
        item.error.message = ''
        // The reason goes with the error: some rows print it in place of the message.
        item.error.assetFileFailReason = AssetFileFailReason.None
      },
      // And the warning its batch load left behind: the metadata is here now.
      afterMetadataLoaded: (queueId, item) => {
        if (metadataFailures.delete(metadataFailureKey(queueId, item))) {
          item.error.hasError = false
          item.error.message = ''
        }
      },
    },
    connection: useDamNotificationsConnection(),
  })

  // A store disposed of leaves nothing behind: no timer of a poll, no listener for the tab or for the socket.
  if (getCurrentScope()) onScopeDispose(() => settlement.dispose())

  // From here the poll of the queue asks about the row.
  const track = (queueId: string, item: UploadQueueItem, options?: { clientFailed?: boolean }) => {
    handedOver.add(toRaw(item))
    settlement.track(queueId, item, options)
  }

  // Getters (parameterized - plain functions)
  function getQueueFileInputKey(queueId: string) {
    if (queueId in queues.value) {
      return queues.value[queueId].fileInputKey
    }
    return -1
  }

  function getQueue(queueId: string) {
    if (queueId in queues.value) {
      return queues.value[queueId]
    }
    return null
  }

  function getQueueItems(queueId: string) {
    if (queueId in queues.value) {
      return queues.value[queueId].items
    }
    return []
  }

  function getQueueItemsByStatus(queueId: string, status: UploadQueueItemStatusType) {
    if (queueId in queues.value) {
      return queues.value[queueId].items.filter((item) => item.status === status)
    }
    return []
  }

  function getQueueTotalCount(queueId: string) {
    if (queueId in queues.value) {
      return queues.value[queueId].totalCount
    }
    return 0
  }

  function getQueueProcessedCount(queueId: string) {
    if (queueId in queues.value) {
      return queues.value[queueId].processedCount
    }
    return 0
  }

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

  function getQueueItemsTypes(queueId: string) {
    const types: Array<DamAssetTypeType> = []
    if (queueId in queues.value && queues.value[queueId].items.length > 0) {
      for (let i = 0; i < queues.value[queueId].items.length; i++) {
        if (types.includes(queues.value[queueId].items[i].assetType)) {
          continue
        }
        types.push(queues.value[queueId].items[i].assetType)
      }
    }
    return types
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
        uniqueQueueItemKey('file_' + file.name),
        UploadQueueItemType.File,
        UploadQueueItemStatus.Waiting,
        type,
        CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.file = file
      queueItem.displayTitle = file.name
      createQueue(queueId)
      addQueueItem(queueId, queueItem)
      recalculateQueueCounts(queueId)
      processUpload(queueId)
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
        uniqueQueueItemKey('file_' + file.name),
        UploadQueueItemType.SlotFile,
        UploadQueueItemStatus.Waiting,
        assetType,
        CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.file = file
      queueItem.displayTitle = file.name
      queueItem.assetId = assetId
      queueItem.slotName = slotName

      createQueue(queueId)
      addQueueItem(queueId, queueItem)
      recalculateQueueCounts(queueId)
      processUpload(queueId)
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
        CHUNK_SIZE,
        currentAssetLicenceId.value
      )
      queueItem.assetStatus = asset.attributes.assetStatus
      queueItem.displayTitle = asset.texts.displayTitle
      queueItem.assetId = asset.id
      queueItem.fileId = asset.mainFile ? asset.mainFile.id : null
      // Or the switch in the queue form shows a `true` as off, and the user has to toggle it twice.
      queueItem.mainFileSingleUse = asset.mainFileSingleUse
      queueItem.imagePreview = asset.mainFile && asset.mainFile.links ? asset.mainFile.links.image_list : undefined

      createQueue(queueId)
      addQueueItem(queueId, queueItem)
      recalculateQueueCounts(queueId)
      processUpload(queueId)
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
      metadataFailures.add(metadataFailureKey(queueId, item))
      item.status = UploadQueueItemStatus.Failed
      item.error.hasError = true
      // Its own wording: this row was never uploaded and has no refresh button to be sent to.
      item.error.message = translate('system.uploadErrors.metadataUnavailable')
    })
    recalculateQueueCounts(queueId)
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
        uniqueQueueItemKey('externalProviderAsset_' + asset.id),
        UploadQueueItemType.ExternalProviderAsset,
        importAsset ? UploadQueueItemStatus.Waiting : UploadQueueItemStatus.Uploaded,
        asset.attributes.assetType,
        CHUNK_SIZE,
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
      createQueue(queueId)
      addQueueItem(queueId, queueItem)
      recalculateQueueCounts(queueId)
      processUpload(queueId)
    }
  }

  function forceReloadFileInput(queueId: string) {
    createQueue(queueId)
    queues.value[queueId].fileInputKey++
  }

  async function fetchLazyAdditionalMetadata(queueId: string, licenceId: number, assetIds: DocId[]) {
    const { getAuthorConflicts } = useAssetSuggestions()
    const res = await fetchAssetListByIds(assetIds, licenceId)
    for (let i = 0; i < res.length; i++) {
      const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === res[i].id)
      if (foundIndex > -1) {
        queues.value[queueId].items[foundIndex].keywords = res[i].keywords
        queues.value[queueId].items[foundIndex].authors = res[i].authors
        queues.value[queueId].items[foundIndex].customData = res[i].metadata.customData
        queues.value[queueId].items[foundIndex].mainFileSingleUse = res[i].mainFileSingleUse
        queues.value[queueId].items[foundIndex].status = UploadQueueItemStatus.Uploaded
        queues.value[queueId].items[foundIndex].authorConflicts = getAuthorConflicts(res[i].metadata.authorSuggestions)
        queues.value[queueId].items[foundIndex].canEditMetadata = true
        // And the warning an earlier batch left behind: the metadata it complained about is here.
        if (metadataFailures.delete(metadataFailureKey(queueId, queues.value[queueId].items[foundIndex]))) {
          queues.value[queueId].items[foundIndex].error.hasError = false
          queues.value[queueId].items[foundIndex].error.message = ''
        }
        addToCachedAuthors(queues.value[queueId].items[foundIndex].authors)
      }
    }
    failStillLoading(queueId, assetIds)
    fetchCachedAuthors()
  }

  async function removeByAssetId(queueId: string, assetId: DocId) {
    if (!(queueId in queues.value)) return
    const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === assetId)
    if (foundIndex === -1) {
      recalculateQueueCounts(queueId)

      return
    }
    /* Through the same teardown, not a bare splice: Delete is offered while the upload still runs
     * (the metadata event arrives after the first chunk), and it would have kept posting chunks. */
    await removeByIndex(queueId, foundIndex)
  }

  async function removeByIndex(queueId: string, index: number) {
    if (queueId in queues.value && queues.value[queueId].items[index]) {
      const item = queues.value[queueId].items[index]
      // Removal can land mid-upload, and after a delete the asset is already gone server-side.
      item.status = UploadQueueItemStatus.Stop
      // The poll of the queue no longer asks about it, nor does a read a notification asked for on its behalf.
      settlement.untrack(item)
      uploadStopHandles.get(item)?.()
      uploadStopHandles.delete(item)
      metadataFailures.delete(metadataFailureKey(queueId, item))
      queues.value[queueId].items.splice(index, 1)
      recalculateQueueCounts(queueId)
      // `queueItemUploadStart` returns early on Stop without scheduling, so refill the slot here.
      processUpload(queueId)
    }
  }

  async function removeByExternalProviderAssetId(queueId: string, assetId: AssetExternalProviderId) {
    if (queueId in queues.value) {
      const foundIndex = queues.value[queueId].items.findIndex((item) => item.externalProviderAssetId === assetId)
      if (foundIndex > -1) queues.value[queueId].items.splice(foundIndex, 1)
      recalculateQueueCounts(queueId)
    }
  }

  function createQueue(queueId: string) {
    if (!(queueId in queues.value)) {
      queues.value[queueId] = {
        items: [],
        totalCount: 0,
        processedCount: 0,
        fileInputKey: 0,
        suggestions: { newKeywordNames: new Set<string>(), newAuthorNames: new Set<string>() },
      }
    }
  }

  function addQueueItem(queueId: string, item: UploadQueueItem) {
    queues.value[queueId].items.push(item)
  }

  function processUpload(queueId: string) {
    const waitingItems = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Waiting)
    if (waitingItems.length === 0) {
      //upload finished
      return
    }
    const uploadingCount = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploading).length
    // Starting the full limit regardless of what already runs is what pushed the count over it.
    const availableSlots = QUEUE_MAX_PARALLEL_UPLOADS - uploadingCount
    if (availableSlots <= 0) {
      // wait for empty upload slot
      return
    }
    waitingItems.slice(0, availableSlots).forEach((waitingItem) => queueItemUploadStart(waitingItem, queueId))
  }

  function stopUpload(queueId: string) {
    if (!queues.value[queueId]) return
    if (queues.value[queueId].items.length === 0) {
      // Emptied row by row, the queue still has its idle poll: it goes with the queue.
      settlement.dropQueue(queueId)

      return
    }
    const currentItems = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploading)
    queues.value[queueId].items.forEach((item) => {
      item.status = UploadQueueItemStatus.Stop
      uploadStopHandles.get(item)?.()
      uploadStopHandles.delete(item)
    })
    if (currentItems.length > 0) {
      currentItems.forEach((item) => {
        if (item.latestChunkAbortController) {
          uploadStop(item.latestChunkAbortController)
        }
      })
    }
    clearQueue(queueId)
    forceReloadFileInput(queueId)
  }

  async function stopItemUpload(queueId: string, queueItem: UploadQueueItem) {
    if (!queues.value[queueId] || queues.value[queueId].items.length === 0) return
    queueItem.status = UploadQueueItemStatus.Stop
    settlement.untrack(queueItem)
    uploadStopHandles.get(queueItem)?.()
    uploadStopHandles.delete(queueItem)
    if (queueItem.latestChunkAbortController) {
      uploadStop(queueItem.latestChunkAbortController)
    }
    // By identity: an index the caller has held across an await takes out a different item.
    const currentIndex = queues.value[queueId].items.indexOf(queueItem)
    if (currentIndex > -1) await removeByIndex(queueId, currentIndex)
    processUpload(queueId)
  }

  async function queueItemUploadStart(item: UploadQueueItem, queueId: string) {
    // external provider asset import
    if (item.type === UploadQueueItemType.ExternalProviderAsset) {
      const { importInit } = externalProviderImport(item)
      await importInit()
      // It has its ids only from that answer on, and no upload whose finish would hand it over.
      if (item.status === UploadQueueItemStatus.Processing) track(queueId, item)
      recalculateQueueCounts(queueId)
      processUpload(queueId)
      return
    }

    // standard + slot upload
    const { upload, uploadInit, stop, finishAttempted } = useUpload(
      item,
      (progress: number, speed: number, estimate: number) => {
        setUploadSpeed(item, progress, speed, estimate)
      }
    )
    uploadStopHandles.set(item, stop)
    try {
      await uploadInit()
      await upload()
      uploadStopHandles.delete(item)
      // Not a row its notification has settled meanwhile, nor a stopped one.
      if (item.status === UploadQueueItemStatus.Processing) track(queueId, item)
      processUpload(queueId)
    } catch (e) {
      uploadStopHandles.delete(item)
      if (item.status === UploadQueueItemStatus.Stop) {
        // Cancelled by the user — the item is already gone from the queue, nothing to report.
        return
      }
      // The processed notification can beat the answer to the finish request: a row it has settled stays
      // uploaded, whatever became of that request.
      if (item.status === UploadQueueItemStatus.Uploaded) return
      // So can the failed one, and only the settlement fails a row before this: the server has said its last word
      // about that file.
      const failedByServer = item.status === UploadQueueItemStatus.Failed
      const message = resolveUploadErrorMessage(e)
      // One alert per reason: a licence that refuses uploads fails every file in the batch.
      const alreadyReported = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Failed).some(
        (failedItem) => failedItem.error.message === message
      )

      item.error.hasError = true
      item.error.message = message
      item.status = UploadQueueItemStatus.Failed
      // Its metadata event comes while the file still sends, and had enabled the form.
      item.canEditMetadata = false
      if (!alreadyReported) {
        showError(message)
      }
      // The finish request went out, so the server may complete the file all the same: the row is asked about for
      // as long as it stays in the queue. Not when the server has refused that request: it will not finish the file.
      if (finishAttempted() && !failedByServer && !isRefusal(e)) {
        track(queueId, item, { clientFailed: true })
      }
      recalculateQueueCounts(queueId)
      processUpload(queueId)
    }
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
    return settlement.notify({ kind: 'processed', assetId, fileId })
  }

  function queueItemFailed(assetId: DocId, failReason: AssetFileFailReasonType, fileId: DocIdNullable = null) {
    settlement.settleKnownFailed({ assetId, fileId }, failReason)
  }

  function queueItemMetadataProcessed(assetId: DocId) {
    return settlement.notify({ kind: 'metadata', assetId, fileId: null })
  }

  function queueItemDuplicate(
    assetId: DocId,
    originAssetFile: DocIdNullable = null,
    assetType: DamAssetTypeType | null = null,
    fileId: DocIdNullable = null
  ) {
    return settlement.settleKnownDuplicate({ assetId, fileId }, originAssetFile, assetType)
  }

  /* The refresh button of a row: asks what became of the file now, and settles by it the rows of the asset that
   * hold the file of this row. Never a slot upload: the asset says nothing about which of its slots finished. */
  function refreshQueueItem(item: UploadQueueItem): Promise<UploadRefreshOutcome> {
    if (isNull(item.assetId)) return Promise.resolve('error')

    return settlement.refreshAsset({ assetId: item.assetId, fileId: item.fileId })
  }

  function setUploadSpeed(item: UploadQueueItem, progress: number, speed: number, estimate: number) {
    item.progress.progressPercent = progress
    item.progress.remainingTime = estimate
    item.progress.speed = speed
  }

  function recalculateQueueCounts(queueId: string) {
    queues.value[queueId].totalCount = queues.value[queueId].items.length
    queues.value[queueId].processedCount =
      getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploaded).length +
      getQueueItemsByStatus(queueId, UploadQueueItemStatus.Failed).length
  }

  function clearQueue(queueId: string) {
    queues.value[queueId]?.items.forEach((item) => {
      metadataFailures.delete(metadataFailureKey(queueId, item))
      /* A file that is still on its way is stopped as `stopUpload` stops it: left going, it was sent to its end
       * behind the emptied queue, and the asset it made stayed. A settled row is left as it is - unless its file
       * is still being sent: a notification can fail the row, or settle it, before the upload has ended. */
      if (!isUnderWay(item.status) && !uploadStopHandles.has(item)) return
      item.status = UploadQueueItemStatus.Stop
      uploadStopHandles.get(item)?.()
      uploadStopHandles.delete(item)
      if (item.latestChunkAbortController) uploadStop(item.latestChunkAbortController)
    })
    // Before the queue is replaced: its rows are no longer asked about.
    settlement.dropQueue(queueId)
    queues.value[queueId] = {
      items: [],
      totalCount: 0,
      processedCount: 0,
      fileInputKey: getQueueFileInputKey(queueId) + 1,
      suggestions: { newKeywordNames: new Set<string>(), newAuthorNames: new Set<string>() },
    }
  }

  function queueItemsReplaceEmptyCustomDataValue(
    queueId: string,
    data: { assetType: DamAssetTypeType; elementProperty: string; value: CustomDataValue },
    forceReplace = false
  ) {
    const items = queues.value[queueId].items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.assetType !== data.assetType) continue
      const current = item.customData[data.elementProperty]
      // `null` is how a value saved empty comes back; a field of several values is empty as an empty list.
      const empty =
        isUndefined(current) || isNull(current) || current === '' || (Array.isArray(current) && !current.length)
      if (forceReplace || empty) {
        item.customData[data.elementProperty] = data.value
      }
    }
  }

  /* Keywords and authors go only into the items whose asset type has them enabled, as a custom value goes only
   * into the items of its type: the row of another item has no input for them, and the bulk save would send them. */
  function assetTypeHas(feature: 'keywords' | 'authors') {
    const { getDamConfigExtSystem } = useDamConfigState(damClient)
    const { currentExtSystemId } = useCurrentExtSystem()
    const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)

    return (assetType: DamAssetTypeType) => !!configExtSystem?.[assetType]?.[feature]?.enabled
  }

  function queueItemsReplaceEmptyKeywords(queueId: string, value: string[], forceReplace = false) {
    const enabled = assetTypeHas('keywords')
    const items = queues.value[queueId].items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!enabled(item.assetType)) continue
      if (forceReplace || isUndefined(item.keywords) || item.keywords.length === 0) {
        item.keywords = value
      }
    }
  }

  function queueItemsReplaceEmptyAuthors(queueId: string, value: string[], forceReplace = false) {
    const enabled = assetTypeHas('authors')
    const items = queues.value[queueId].items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!enabled(item.assetType)) continue
      if (forceReplace || isUndefined(item.authors) || item.authors.length === 0) {
        item.authors = value
      }
    }
  }

  function updateAssetMetadata(asset: AssetDetailItemDto) {
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === asset.id) {
          item.keywords = asset.keywords
          item.authors = asset.authors
          item.customData = asset.metadata.customData
          item.mainFileSingleUse = asset.mainFileSingleUse
        }
      })
    }
  }

  function reset() {
    Object.keys(queues.value).forEach((queueId) => settlement.dropQueue(queueId))
    queues.value = {}
  }

  return {
    queues,
    getQueueFileInputKey,
    getQueue,
    getQueueItems,
    getQueueItemsByStatus,
    getQueueTotalCount,
    getQueueProcessedCount,
    getQueueItemForSlotItem,
    getQueueItemsTypes,
    addByFiles,
    addByFilesAsSlotUpload,
    addByAssets,
    addByExternalProviderAsset,
    forceReloadFileInput,
    fetchLazyAdditionalMetadata,
    removeByAssetId,
    removeByIndex,
    removeByExternalProviderAssetId,
    createQueue,
    addQueueItem,
    processUpload,
    stopUpload,
    stopItemUpload,
    queueItemUploadStart,
    queueItemProcessed,
    queueItemFailed,
    queueItemMetadataProcessed,
    queueItemDuplicate,
    refreshQueueItem,
    setUploadSpeed,
    recalculateQueueCounts,
    clearQueue,
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
