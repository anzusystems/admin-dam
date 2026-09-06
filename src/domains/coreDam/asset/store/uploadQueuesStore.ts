import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useExternalProviders } from '@/domains/coreDam/asset/composables/externalProviders'
import { damClient } from '@/shared/apiClients/damClient'
import { fetchAsset, fetchAssetListByIds } from '@/domains/coreDam/asset/api/assetApi'
import { fetchAudioFile } from '@/domains/coreDam/asset/api/audioApi'
import { fetchDocumentFile } from '@/domains/coreDam/asset/api/documentApi'
import { fetchImageFile } from '@/domains/coreDam/asset/api/imageApi'
import { fetchVideoFile } from '@/domains/coreDam/asset/api/videoApi'
import { externalProviderImport } from '@/domains/coreDam/shared/services/upload/externalProviderImportService'
import {
  resolveUploadErrorMessage,
  uploadStop,
  useUpload,
} from '@/domains/coreDam/shared/services/upload/uploadService'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type {
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'
import type {
  AssetFileFailReasonType,
  CustomDataValue,
  DamAssetTypeType,
  UploadQueueItemStatusType,
} from '@anzusystems/common-admin'
import {
  i18n,
  type AssetDetailItemDto,
  AssetFileFailReason,
  AssetFileLinkType,
  type AssetFileNullable,
  type AssetSearchListItemDto,
  DamAssetStatus,
  DamAssetType,
  damFileTypeFix,
  type DocIdNullable,
  getAssetTypeByMimeType,
  type UploadQueue,
  type UploadQueueItem,
  UploadQueueItemStatus,
  UploadQueueItemType,
  useAssetSuggestions,
  useDamConfigState,
  useUploadQueueItemFactory,
} from '@anzusystems/common-admin'

const QUEUE_MAX_PARALLEL_UPLOADS = 2

// The axios cancel token reaches only a request on the wire, not the gaps between chunks.
const uploadStopHandles = new WeakMap<UploadQueueItem, () => void>()

// Outside a component, so the global instance - the same way `uploadService` reaches it.
const translate = (key: string) => {
  const { t } = i18n.global || i18n

  return t(key)
}

// A file name is not unique, and a duplicate `:key` lets Vue's keyed diff patch the wrong tile.
let queueItemSequence = 0
const uniqueQueueItemKey = (prefix: string) => `${prefix}_${++queueItemSequence}`
const CHUNK_SIZE = 10485760

export const useUploadQueuesStore = defineStore('damUploadQueuesStore', () => {
  // Items whose metadata could not be read - not by message, which changes with the language.
  const metadataFailures = new Set<string>()
  const metadataFailureKey = (queueId: string, item: UploadQueueItem) => queueId + '/' + item.key

  const { createDefault } = useUploadQueueItemFactory()
  const { showError } = useAlerts()
  const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
  const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

  const queues = ref<{ [queueId: string]: UploadQueue }>({})

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
      // The fallback reschedules itself, so a removed item would poll fetchAsset for minutes.
      clearTimeout(item.notificationFallbackTimer)
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
    if (!queues.value[queueId] || queues.value[queueId].items.length === 0) return
    const currentItems = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploading)
    queues.value[queueId].items.forEach((item) => {
      item.status = UploadQueueItemStatus.Stop
      clearTimeout(item.notificationFallbackTimer)
      uploadStopHandles.get(item)?.()
      uploadStopHandles.delete(item)
    })
    if (currentItems.length > 0) {
      currentItems.forEach((item) => {
        if (item.latestChunkCancelToken) {
          uploadStop(item.latestChunkCancelToken)
        }
      })
    }
    clearQueue(queueId)
    forceReloadFileInput(queueId)
  }

  async function stopItemUpload(queueId: string, queueItem: UploadQueueItem) {
    if (!queues.value[queueId] || queues.value[queueId].items.length === 0) return
    queueItem.status = UploadQueueItemStatus.Stop
    clearTimeout(queueItem.notificationFallbackTimer)
    uploadStopHandles.get(queueItem)?.()
    uploadStopHandles.delete(queueItem)
    if (queueItem.latestChunkCancelToken) {
      uploadStop(queueItem.latestChunkCancelToken)
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
      recalculateQueueCounts(queueId)
      processUpload(queueId)
      return
    }

    // standard + slot upload
    const { upload, uploadInit, stop } = useUpload(item, (progress: number, speed: number, estimate: number) => {
      setUploadSpeed(item, progress, speed, estimate)
    })
    uploadStopHandles.set(item, stop)
    try {
      await uploadInit()
      await upload()
      uploadStopHandles.delete(item)
      processUpload(queueId)
    } catch (e) {
      uploadStopHandles.delete(item)
      if (item.status === UploadQueueItemStatus.Stop) {
        // Cancelled by the user — the item is already gone from the queue, nothing to report.
        return
      }
      const message = resolveUploadErrorMessage(e)
      // One alert per reason: a licence that refuses uploads fails every file in the batch.
      const alreadyReported = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Failed).some(
        (failedItem) => failedItem.error.message === message
      )

      item.error.hasError = true
      item.error.message = message
      item.status = UploadQueueItemStatus.Failed
      if (!alreadyReported) {
        showError(message)
      }
      recalculateQueueCounts(queueId)
      processUpload(queueId)
    }
  }

  /* Slot uploads of one asset differ only in the file, so an event naming the asset alone settled
   * all of them. A mass-edit row without a file id cannot be told from one either, so only the
   * processed handler passes `matchAssetWithoutFile` - it merely decorates such a row, while a
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
    /* A slot answers only to an event naming its own file, so without notifications it stays
     * unfinished - the fallback reaches this far only for the main file. */
    if (item.type === UploadQueueItemType.SlotFile) return !isNull(fileId) && item.fileId === fileId
    if (item.type === UploadQueueItemType.Asset && isNull(item.fileId)) return matchAssetWithoutFile

    return isNull(fileId) || item.fileId === fileId
  }

  async function queueItemProcessed(assetId: DocId, fileId: DocIdNullable = null) {
    /* Settled first, decorated from the fetch below: gating the transition on that fetch left the
     * item running whenever it failed, or whenever the asset had no main file. Called by the
     * notification, the fallback and the refresh button alike. */
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (!notificationMatches(item, assetId, fileId, true)) return
        clearTimeout(item.notificationFallbackTimer)
        // The batch load owns a mass-edit row's status; the event only decorates it, below.
        if (item.type !== UploadQueueItemType.Asset) item.status = UploadQueueItemStatus.Uploaded
        /* Nothing else clears the fallback's "press refresh" warning, and refresh comes back through
         * here. Not the missing-metadata one: it is still true, and cleared where it stops being. */
        if (!metadataFailures.has(metadataFailureKey(queueId, item))) {
          item.error.hasError = false
          item.error.message = ''
          // The reason goes with the error: some rows print it in place of the message.
          item.error.assetFileFailReason = AssetFileFailReason.None
        }
        processUpload(queueId)
      })
      recalculateQueueCounts(queueId)
    }

    let asset: Awaited<ReturnType<typeof fetchAsset>>
    try {
      asset = await fetchAsset(assetId)
    } catch (error) {
      console.error('uploadQueue: the processed asset could not be read', error)

      return
    }
    if (!asset.mainFile) return
    const mainFile = asset.mainFile
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (!notificationMatches(item, asset.id, fileId, true)) return
        item.assetStatus = asset.attributes.assetStatus
        // Only when the item is the main file: a slot would take a thumbnail describing another.
        if (isNull(item.fileId) || item.fileId === mainFile.id) {
          if (mainFile.links?.image_detail) {
            item.imagePreview = mainFile.links.image_detail
          }
          // Not on a mass-edit row, where that flag is a form field the user may have just set.
          if (item.type !== UploadQueueItemType.Asset) {
            item.mainFileSingleUse = asset.mainFileSingleUse
          }
        }
      })
    }
  }

  function queueItemFailed(assetId: DocId, failReason: AssetFileFailReasonType, fileId: DocIdNullable = null) {
    // No fetch: the caller carries everything, and a failed one left the item looking alive.
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (notificationMatches(item, assetId, fileId)) {
          clearTimeout(item.notificationFallbackTimer)
          item.error.hasError = true
          // The row prints the message over the fail reason chip, and the old one is not why.
          item.error.message = ''
          metadataFailures.delete(metadataFailureKey(queueId, item))
          item.status = UploadQueueItemStatus.Failed
          item.error.assetFileFailReason = failReason
          item.canEditMetadata = false
          processUpload(queueId)
        }
      })
      recalculateQueueCounts(queueId)
    }
  }

  async function queueItemMetadataProcessed(assetId: DocId) {
    const { updateNewNames, getAuthorConflicts } = useAssetSuggestions()
    const assetDetailStore = useAssetDetailStore()
    /* The only place an ordinary upload is granted `canEditMetadata`, and the notification comes
     * once - so a single failure disabled the form for good and the bulk save skipped the item. */
    let asset: Awaited<ReturnType<typeof fetchAsset>>
    try {
      asset = await fetchAsset(assetId)
    } catch (error) {
      // Said on the item: the form stays disabled and the bulk save skips it, silently otherwise.
      console.error('uploadQueue: the asset metadata could not be read', error)
      for (const queueId in queues.value) {
        queues.value[queueId].items.forEach((item) => {
          if (item.assetId !== assetId) return
          // A slot upload of the same asset has its own branch below and may still be running.
          if (item.type === UploadQueueItemType.SlotFile) return
          // A mass-edit row already has its metadata, and could not take such a warning back.
          if (item.canEditMetadata) return
          metadataFailures.add(metadataFailureKey(queueId, item))
          item.error.hasError = true
          item.error.message = translate('system.uploadErrors.metadataFailed')
        })
      }

      return
    }
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === asset.id && item.type !== UploadQueueItemType.SlotFile) {
          item.keywords = asset.keywords
          item.authors = asset.authors
          item.customData = asset.metadata.customData
          item.mainFileSingleUse = asset.mainFileSingleUse
          updateNewNames(asset.metadata.authorSuggestions, queues.value[queueId].suggestions.newAuthorNames)
          updateNewNames(asset.metadata.keywordSuggestions, queues.value[queueId].suggestions.newKeywordNames)
          item.authorConflicts = getAuthorConflicts(asset.metadata.authorSuggestions)
          item.canEditMetadata = true
          // And the warning an earlier attempt left behind: the metadata is here now.
          if (metadataFailures.delete(metadataFailureKey(queueId, item))) {
            item.error.hasError = false
            item.error.message = ''
          }
          addToCachedKeywords(item.keywords)
          addToCachedAuthors(item.authors)
          addToCachedAuthors(item.authorConflicts)
        } else if (
          item.assetId === asset.id &&
          item.type === UploadQueueItemType.SlotFile &&
          assetDetailStore.asset?.id === assetId &&
          assetDetailStore.asset.mainFile === null
        ) {
          assetDetailStore.asset.mainFile = asset.mainFile
        }
      })
      recalculateQueueCounts(queueId)
    }
    fetchCachedAuthors()
    fetchCachedKeywords()
  }

  async function queueItemDuplicate(
    assetId: DocId,
    originAssetFile: DocIdNullable = null,
    assetType: DamAssetTypeType | null = null,
    fileId: DocIdNullable = null
  ) {
    // Settled first, decorated afterwards: waiting for the origin file held an upload slot.
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (!notificationMatches(item, assetId, fileId)) return
        clearTimeout(item.notificationFallbackTimer)
        item.isDuplicate = true
        item.status = UploadQueueItemStatus.Uploaded
        item.canEditMetadata = false // todo check with product
        // Same as above: a duplicate is a settled item, not a failed one.
        item.error.hasError = false
        item.error.message = ''
        item.error.assetFileFailReason = AssetFileFailReason.None
        processUpload(queueId)
      })
      recalculateQueueCounts(queueId)
    }

    // @todo product question what to do with duplicate file display
    let file: null | AssetFileNullable = null
    if (originAssetFile && assetType) {
      try {
        switch (assetType) {
          case DamAssetType.Image:
            file = await fetchImageFile(originAssetFile)
            break
          case DamAssetType.Audio:
            file = await fetchAudioFile(originAssetFile)
            break
          case DamAssetType.Video:
            file = await fetchVideoFile(originAssetFile)
            break
          case DamAssetType.Document:
            file = await fetchDocumentFile(originAssetFile)
            break
        }
      } catch (error) {
        console.error('uploadQueue: the duplicated file could not be read', error)
      }
    }
    if (isNull(file)) return
    const duplicate = file
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (!notificationMatches(item, assetId, fileId)) return
        item.fileId = duplicate.id
        item.duplicateAssetId = duplicate.asset
        item.mainFileSingleUse = duplicate.flags.singleUse
        if (duplicate.links?.image_detail) {
          item.imagePreview = duplicate.links.image_detail
        }
      })
    }
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
      clearTimeout(item.notificationFallbackTimer)
      metadataFailures.delete(metadataFailureKey(queueId, item))
    })
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
      if (
        forceReplace ||
        isUndefined(item.customData[data.elementProperty]) ||
        item.customData[data.elementProperty] === ''
      ) {
        item.customData[data.elementProperty] = data.value
      }
    }
  }

  function queueItemsReplaceEmptyKeywords(queueId: string, value: string[], forceReplace = false) {
    const items = queues.value[queueId].items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (forceReplace || isUndefined(item.keywords) || item.keywords.length === 0) {
        item.keywords = value
      }
    }
  }

  function queueItemsReplaceEmptyAuthors(queueId: string, value: string[], forceReplace = false) {
    const items = queues.value[queueId].items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
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
