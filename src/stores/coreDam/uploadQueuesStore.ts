import { useCurrentAssetLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useExternalProviders } from '@/composables/system/externalProviders'
import { damClient } from '@/services/api/clients/damClient'
import { fetchAsset, fetchAssetListByIds } from '@/services/api/coreDam/assetApi'
import { fetchAudioFile } from '@/services/api/coreDam/audioApi'
import { fetchDocumentFile } from '@/services/api/coreDam/documentApi'
import { fetchImageFile } from '@/services/api/coreDam/imageApi'
import { fetchVideoFile } from '@/services/api/coreDam/videoApi'
import { externalProviderImport } from '@/services/upload/externalProviderImportService'
import { uploadStop, useUpload } from '@/services/upload/uploadService'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/coreDam/AssetExternalProvider'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import type {
  AssetFileFailReasonType,
  CustomDataValue,
  DamAssetTypeType,
  UploadQueueItemStatusType,
} from '@anzusystems/common-admin'
import {
  type AssetDetailItemDto,
  AssetFileLinkType,
  type AssetFileNullable,
  type AssetSearchListItemDto,
  DamAssetStatus,
  DamAssetType,
  damFileTypeFix,
  type DocId,
  type DocIdNullable,
  getAssetTypeByMimeType,
  isUndefined,
  type UploadQueue,
  type UploadQueueItem,
  UploadQueueItemStatus,
  UploadQueueItemType,
  useAssetSuggestions,
  useDamConfigState,
  useUploadQueueItemFactory,
} from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

const QUEUE_MAX_PARALLEL_UPLOADS = 2
const CHUNK_SIZE = 10485760

export const useUploadQueuesStore = defineStore('damUploadQueuesStore', () => {
  const { createDefault } = useUploadQueueItemFactory()
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

  function getQueueItemForSlotItem(queueId: string, slotName: string, assetId: DocId) {
    if (queueId in queues.value) {
      return queues.value[queueId].items.find((item) => item.slotName === slotName && item.assetId === assetId)
    }
    return undefined
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
        'file_' + file.name,
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
        'file_' + file.name,
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
      queueItem.imagePreview = asset.mainFile && asset.mainFile.links ? asset.mainFile.links.image_list : undefined

      createQueue(queueId)
      addQueueItem(queueId, queueItem)
      recalculateQueueCounts(queueId)
      processUpload(queueId)
    }
    fetchLazyAdditionalMetadata(queueId, currentAssetLicenceId.value, assetIds)
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
        'externalProviderAsset_' + asset.id,
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
        queues.value[queueId].items[foundIndex].status = UploadQueueItemStatus.Uploaded
        queues.value[queueId].items[foundIndex].authorConflicts = getAuthorConflicts(
          res[i].metadata.authorSuggestions
        )
        queues.value[queueId].items[foundIndex].canEditMetadata = true
        addToCachedAuthors(queues.value[queueId].items[foundIndex].authors)
      }
    }
    fetchCachedAuthors()
  }

  async function removeByAssetId(queueId: string, assetId: DocId) {
    if (queueId in queues.value) {
      const foundIndex = queues.value[queueId].items.findIndex((item) => item.assetId === assetId)
      if (foundIndex > -1) queues.value[queueId].items.splice(foundIndex, 1)
      recalculateQueueCounts(queueId)
    }
  }

  async function removeByIndex(queueId: string, index: number) {
    if (queueId in queues.value && queues.value[queueId].items[index]) {
      queues.value[queueId].items.splice(index, 1)
      recalculateQueueCounts(queueId)
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
    if (uploadingCount === QUEUE_MAX_PARALLEL_UPLOADS) {
      // wait for empty upload slot
      return
    }
    for (let i = 0; i < QUEUE_MAX_PARALLEL_UPLOADS; i++) {
      if (waitingItems[i]) queueItemUploadStart(waitingItems[i], queueId)
    }
  }

  function stopUpload(queueId: string) {
    if (!queues.value[queueId] || queues.value[queueId].items.length === 0) return
    const currentItems = getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploading)
    queues.value[queueId].items.forEach((item) => {
      item.status = UploadQueueItemStatus.Stop
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

  async function stopItemUpload(queueId: string, queueItem: UploadQueueItem, index: number) {
    if (!queues.value[queueId] || queues.value[queueId].items.length === 0) return
    queueItem.status = UploadQueueItemStatus.Stop
    if (queueItem.latestChunkCancelToken) {
      uploadStop(queueItem.latestChunkCancelToken)
    }
    await removeByIndex(queueId, index)
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
    const { upload, uploadInit } = useUpload(item, (progress: number, speed: number, estimate: number) => {
      setUploadSpeed(item, progress, speed, estimate)
    })
    try {
      await uploadInit()
      await upload()
      processUpload(queueId)
    } catch (e) {
      item.error.hasError = true
      item.status = UploadQueueItemStatus.Failed
      recalculateQueueCounts(queueId)
      processUpload(queueId)
    }
  }

  async function queueItemProcessed(assetId: DocId) {
    const asset = await fetchAsset(assetId)
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === asset.id && asset.mainFile) {
          clearTimeout(item.notificationFallbackTimer)
          item.status = UploadQueueItemStatus.Uploaded
          item.assetStatus = asset.attributes.assetStatus
          if (asset.mainFile.links?.image_detail) {
            item.imagePreview = asset.mainFile.links.image_detail
          }
          item.mainFileSingleUse = asset.mainFileSingleUse
          processUpload(queueId)
        }
      })
      recalculateQueueCounts(queueId)
    }
  }

  async function queueItemFailed(assetId: DocId, failReason: AssetFileFailReasonType) {
    const asset = await fetchAsset(assetId)
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === asset.id) {
          clearTimeout(item.notificationFallbackTimer)
          item.error.hasError = true
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
    const asset = await fetchAsset(assetId)
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
    assetType: DamAssetTypeType | null = null
  ) {
    // @todo product question what to do with duplicate file display
    let file: null | AssetFileNullable = null
    if (originAssetFile && assetType) {
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
    }
    for (const queueId in queues.value) {
      queues.value[queueId].items.forEach((item) => {
        if (item.assetId === assetId) {
          clearTimeout(item.notificationFallbackTimer)
          item.isDuplicate = true
          item.status = UploadQueueItemStatus.Uploaded
          item.canEditMetadata = false // todo check with product
          if (file) {
            item.fileId = file.id
            item.duplicateAssetId = file.asset
            item.mainFileSingleUse = file.flags.singleUse
          }
          if (file?.links?.image_detail) {
            item.imagePreview = file.links.image_detail
          }
          processUpload(queueId)
        }
      })
      recalculateQueueCounts(queueId)
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
