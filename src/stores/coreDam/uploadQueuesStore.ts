import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { isUndefined } from '@anzusystems/common-admin'
import { uploadStop, useUpload } from '@/services/upload/uploadService'
import { fetchImageFile } from '@/services/api/coreDam/imageApi'
import { fetchAsset, fetchAssetListByIds } from '@/services/api/coreDam/assetApi'
import type { UploadQueue, UploadQueueItem } from '@/types/coreDam/UploadQueue'
import { QueueItemStatus, QueueItemType } from '@/types/coreDam/UploadQueue'
import type { AssetFileNullable } from '@/types/coreDam/File'
import { LinkType } from '@/types/coreDam/File'
import type { AssetSearchListItemDto } from '@/types/coreDam/Asset'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import { getAssetTypeByMimeType } from '@/services/upload/mimeTypeService'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { fetchAudioFile } from '@/services/api/coreDam/audioApi'
import { fetchVideoFile } from '@/services/api/coreDam/videoApi'
import { fetchDocumentFile } from '@/services/api/coreDam/documentApi'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/coreDam/AssetExternalProvider'
import { externalProviderImport } from '@/services/upload/externalProviderImportService'
import { useExternalProviders } from '@/composables/system/externalProviders'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import type { AssetFileFailReason } from '@/model/coreDam/valueObject/AssetFileFailReason'
import { useUploadQueueItemFactory } from '@/model/coreDam/factory/UploadQueueItemFactory'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { getAuthorConflicts, updateNewNames } from '@/services/AssetSuggestionsService'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import type { AssetDetailItemDto } from '@/types/coreDam/Asset'
import { fileTypeFix } from '@/services/fileType'

interface State {
  queues: { [queueId: string]: UploadQueue }
}

const QUEUE_MAX_PARALLEL_UPLOADS = 2
const CHUNK_SIZE = 10485760

const { createDefault } = useUploadQueueItemFactory()
const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()
const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

export const useUploadQueuesStore = defineStore('damUploadQueuesStore', {
  state: (): State => ({
    queues: {},
  }),
  getters: {
    getQueueFileInputKey: (state) => {
      return (queueId: string) => {
        if (queueId in state.queues) {
          return state.queues[queueId].fileInputKey
        }
        return -1
      }
    },
    getQueue: (state) => {
      return (queueId: string) => {
        if (queueId in state.queues) {
          return state.queues[queueId]
        }
        return null
      }
    },
    getQueueItems: (state) => {
      return (queueId: string) => {
        if (queueId in state.queues) {
          return state.queues[queueId].items
        }
        return []
      }
    },
    getQueueItemsByStatus: (state) => {
      return (queueId: string, status: QueueItemStatus) => {
        if (queueId in state.queues) {
          return state.queues[queueId].items.filter((item) => item.status === status)
        }
        return []
      }
    },
    getQueueTotalCount: (state) => {
      return (queueId: string) => {
        if (queueId in state.queues) {
          return state.queues[queueId].totalCount
        }
        return 0
      }
    },
    getQueueProcessedCount: (state) => {
      return (queueId: string) => {
        if (queueId in state.queues) {
          return state.queues[queueId].processedCount
        }
        return 0
      }
    },
    getQueueItemForSlotItem: (state) => {
      return (queueId: string, slotName: string, assetId: DocId) => {
        if (queueId in state.queues) {
          return state.queues[queueId].items.find((item) => item.slotName === slotName && item.assetId === assetId)
        }
        return undefined
      }
    },
    getQueueItemsTypes: (state) => {
      return (queueId: string) => {
        const types: Array<AssetType> = []
        if (queueId in state.queues && state.queues[queueId].items.length > 0) {
          for (let i = 0; i < state.queues[queueId].items.length; i++) {
            if (types.includes(state.queues[queueId].items[i].assetType)) {
              continue
            }
            types.push(state.queues[queueId].items[i].assetType)
          }
        }
        return types
      }
    },
  },
  actions: {
    async addByFiles(queueId: string, files: File[]) {
      const { currentAssetLicenceId } = useCurrentAssetLicence()
      for await (const file of files) {
        const type = getAssetTypeByMimeType(fileTypeFix(file))
        if (!type) continue
        const queueItem = createDefault(
          'file_' + file.name,
          QueueItemType.File,
          QueueItemStatus.Waiting,
          type,
          CHUNK_SIZE,
          currentAssetLicenceId.value
        )
        queueItem.file = file
        queueItem.displayTitle = file.name
        this.createQueue(queueId)
        this.addQueueItem(queueId, queueItem)
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
    },
    async addByFilesAsSlotUpload(
      queueId: string,
      files: File[],
      assetId: DocId,
      slotName: string,
      assetType: AssetType
    ) {
      const { currentAssetLicenceId } = useCurrentAssetLicence()
      for await (const file of files) {
        const queueItem = createDefault(
          'file_' + file.name,
          QueueItemType.SlotFile,
          QueueItemStatus.Waiting,
          assetType,
          CHUNK_SIZE,
          currentAssetLicenceId.value
        )
        queueItem.file = file
        queueItem.displayTitle = file.name
        queueItem.assetId = assetId
        queueItem.slotName = slotName

        this.createQueue(queueId)
        this.addQueueItem(queueId, queueItem)
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
    },
    async addByAssets(queueId: string, assets: AssetSearchListItemDto[]) {
      const { currentAssetLicenceId } = useCurrentAssetLicence()
      const assetIds: DocId[] = []
      for await (const asset of assets) {
        assetIds.push(asset.id)
        const queueItem = createDefault(
          'asset_' + asset.id,
          QueueItemType.Asset,
          QueueItemStatus.Loading,
          asset.attributes.assetType,
          CHUNK_SIZE,
          currentAssetLicenceId.value
        )
        queueItem.assetStatus = asset.attributes.assetStatus
        queueItem.displayTitle = asset.texts.displayTitle
        queueItem.assetId = asset.id
        queueItem.fileId = asset.mainFile ? asset.mainFile.id : null
        queueItem.imagePreview = asset.mainFile && asset.mainFile.links ? asset.mainFile.links.image_list : undefined

        this.createQueue(queueId)
        this.addQueueItem(queueId, queueItem)
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
      this.fetchLazyAdditionalMetadata(queueId, currentAssetLicenceId.value, assetIds)
    },
    async addByExternalProviderAsset(queueId: string, assets: AssetExternalProviderListDto[], importAsset = false) {
      const { currentAssetLicenceId } = useCurrentAssetLicence()
      const { activeExternalProvider } = useExternalProviders()
      for await (const asset of assets) {
        const queueItem = createDefault(
          'externalProviderAsset_' + asset.id,
          QueueItemType.ExternalProviderAsset,
          importAsset ? QueueItemStatus.Waiting : QueueItemStatus.Uploaded,
          asset.attributes.assetType,
          CHUNK_SIZE,
          currentAssetLicenceId.value
        )
        queueItem.assetStatus = AssetStatus.WithFile
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
          type: LinkType.Image,
        }
        this.createQueue(queueId)
        this.addQueueItem(queueId, queueItem)
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
    },
    forceReloadFileInput(queueId: string) {
      this.createQueue(queueId)
      this.queues[queueId].fileInputKey++
    },
    async fetchLazyAdditionalMetadata(queueId: string, licenceId: number, assetIds: DocId[]) {
      const res = await fetchAssetListByIds(assetIds, licenceId)
      for (let i = 0; i < res.length; i++) {
        const foundIndex = this.queues[queueId].items.findIndex((item) => item.assetId === res[i].id)
        if (foundIndex > -1) {
          this.queues[queueId].items[foundIndex].keywords = res[i].keywords
          this.queues[queueId].items[foundIndex].authors = res[i].authors
          this.queues[queueId].items[foundIndex].customData = res[i].metadata.customData
          this.queues[queueId].items[foundIndex].status = QueueItemStatus.Uploaded
          this.queues[queueId].items[foundIndex].authorConflicts = getAuthorConflicts(res[i].metadata.authorSuggestions)
          this.queues[queueId].items[foundIndex].canEditMetadata = true
          addToCachedAuthors(this.queues[queueId].items[foundIndex].authors)
        }
      }
      fetchCachedAuthors()
    },
    async removeByAssetId(queueId: string, assetId: DocId) {
      if (queueId in this.queues) {
        const foundIndex = this.queues[queueId].items.findIndex((item) => item.assetId === assetId)
        if (foundIndex > -1) this.queues[queueId].items.splice(foundIndex, 1)
        this.recalculateQueueCounts(queueId)
      }
    },
    async removeByIndex(queueId: string, index: number) {
      if (queueId in this.queues && this.queues[queueId].items[index]) {
        this.queues[queueId].items.splice(index, 1)
        this.recalculateQueueCounts(queueId)
      }
    },
    async removeByExternalProviderAssetId(queueId: string, assetId: AssetExternalProviderId) {
      if (queueId in this.queues) {
        const foundIndex = this.queues[queueId].items.findIndex((item) => item.externalProviderAssetId === assetId)
        if (foundIndex > -1) this.queues[queueId].items.splice(foundIndex, 1)
        this.recalculateQueueCounts(queueId)
      }
    },
    createQueue(queueId: string) {
      if (!(queueId in this.queues)) {
        this.queues[queueId] = {
          items: [],
          totalCount: 0,
          processedCount: 0,
          fileInputKey: 0,
          suggestions: { newKeywordNames: new Set<string>(), newAuthorNames: new Set<string>() },
        }
      }
    },
    addQueueItem(queueId: string, item: UploadQueueItem) {
      this.queues[queueId].items.push(item)
    },
    processUpload(queueId: string) {
      const waitingItems = this.getQueueItemsByStatus(queueId, QueueItemStatus.Waiting)
      if (waitingItems.length === 0) {
        //upload finished
        return
      }
      const uploadingCount = this.getQueueItemsByStatus(queueId, QueueItemStatus.Uploading).length
      if (uploadingCount === QUEUE_MAX_PARALLEL_UPLOADS) {
        // wait for empty upload slot
        return
      }
      for (let i = 0; i < QUEUE_MAX_PARALLEL_UPLOADS; i++) {
        if (waitingItems[i]) this.queueItemUploadStart(waitingItems[i], queueId)
      }
    },
    stopUpload(queueId: string) {
      if (!this.queues[queueId] || this.queues[queueId].items.length === 0) return
      const currentItems = this.getQueueItemsByStatus(queueId, QueueItemStatus.Uploading)
      this.queues[queueId].items.forEach((item) => {
        item.status = QueueItemStatus.Stop
      })
      if (currentItems.length > 0) {
        currentItems.forEach((item) => {
          if (item.chunks[item.currentChunkIndex] && item.chunks[item.currentChunkIndex].cancelTokenSource) {
            uploadStop(item.chunks[item.currentChunkIndex].cancelTokenSource)
          }
        })
      }
      this.clearQueue(queueId)
      this.forceReloadFileInput(queueId)
    },
    async stopItemUpload(queueId: string, queueItem: UploadQueueItem, index: number) {
      if (!this.queues[queueId] || this.queues[queueId].items.length === 0) return
      queueItem.status = QueueItemStatus.Stop
      if (
        queueItem.chunks[queueItem.currentChunkIndex] &&
        queueItem.chunks[queueItem.currentChunkIndex].cancelTokenSource
      ) {
        uploadStop(queueItem.chunks[queueItem.currentChunkIndex].cancelTokenSource)
      }
      await this.removeByIndex(queueId, index)
      this.processUpload(queueId)
    },
    async queueItemUploadStart(item: UploadQueueItem, queueId: string) {
      // external provider asset import
      if (item.type === QueueItemType.ExternalProviderAsset) {
        const { importInit } = externalProviderImport(item)
        await importInit()
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
        return
      }

      // standard + slot upload
      const { upload, uploadInit } = useUpload(item, (progress: number, speed: number, estimate: number) => {
        this.setUploadSpeed(item, progress, speed, estimate)
      })
      try {
        await uploadInit()
        await upload()
        this.processUpload(queueId)
      } catch (e) {
        item.error.hasError = true
        item.status = QueueItemStatus.Failed
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
    },
    async queueItemProcessed(assetId: DocId) {
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id && asset.mainFile) {
            clearTimeout(item.notificationFallbackTimer)
            item.status = QueueItemStatus.Uploaded
            item.assetStatus = asset.attributes.assetStatus
            if (asset.mainFile.links?.image_detail) {
              item.imagePreview = asset.mainFile.links.image_detail
            }
            this.processUpload(queueId)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
    },
    async queueItemFailed(assetId: DocId, failReason: AssetFileFailReason) {
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id) {
            clearTimeout(item.notificationFallbackTimer)
            item.error.hasError = true
            item.status = QueueItemStatus.Failed
            item.error.assetFileFailReason = failReason
            item.canEditMetadata = false
            this.processUpload(queueId)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
    },
    async queueItemMetadataProcessed(assetId: DocId) {
      const assetDetailStore = useAssetDetailStore()
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id && item.type !== QueueItemType.SlotFile) {
            console.log('queueItemMetadataProcessed', asset)
            item.keywords = asset.keywords
            item.authors = asset.authors
            item.customData = asset.metadata.customData
            updateNewNames(asset.metadata.authorSuggestions, this.queues[queueId].suggestions.newAuthorNames)
            updateNewNames(asset.metadata.keywordSuggestions, this.queues[queueId].suggestions.newKeywordNames)
            item.authorConflicts = getAuthorConflicts(asset.metadata.authorSuggestions)
            item.canEditMetadata = true
            addToCachedKeywords(item.keywords)
            addToCachedAuthors(item.authors)
            addToCachedAuthors(item.authorConflicts)
          } else if (
            item.assetId === asset.id &&
            item.type === QueueItemType.SlotFile &&
            assetDetailStore.asset?.id === assetId &&
            assetDetailStore.asset.mainFile === null
          ) {
            assetDetailStore.asset.mainFile = asset.mainFile
          }
        })
        this.recalculateQueueCounts(queueId)
      }
      fetchCachedAuthors()
      fetchCachedKeywords()
    },
    async queueItemDuplicate(
      assetId: DocId,
      originAssetFile: DocIdNullable = null,
      assetType: AssetType | null = null
    ) {
      // @todo product question what to do with duplicate file display
      let file: null | AssetFileNullable = null
      if (originAssetFile && assetType) {
        switch (assetType) {
          case AssetType.Image:
            file = await fetchImageFile(originAssetFile)
            break
          case AssetType.Audio:
            file = await fetchAudioFile(originAssetFile)
            break
          case AssetType.Video:
            file = await fetchVideoFile(originAssetFile)
            break
          case AssetType.Document:
            file = await fetchDocumentFile(originAssetFile)
            break
        }
      }
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === assetId) {
            clearTimeout(item.notificationFallbackTimer)
            item.isDuplicate = true
            item.status = QueueItemStatus.Uploaded
            item.canEditMetadata = false // todo check with product
            if (file) {
              item.fileId = file.id
              item.duplicateAssetId = file.asset
            }
            if (file?.links?.image_detail) {
              item.imagePreview = file.links.image_detail
            }
            this.processUpload(queueId)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
    },
    setUploadSpeed(item: UploadQueueItem, progress: number, speed: number, estimate: number) {
      item.progress.progressPercent = progress
      item.progress.remainingTime = estimate
      item.progress.speed = speed
    },
    recalculateQueueCounts(queueId: string) {
      this.queues[queueId].totalCount = this.queues[queueId].items.length
      this.queues[queueId].processedCount =
        this.getQueueItemsByStatus(queueId, QueueItemStatus.Uploaded).length +
        this.getQueueItemsByStatus(queueId, QueueItemStatus.Failed).length
    },
    clearQueue(queueId: string) {
      this.queues[queueId] = {
        items: [],
        totalCount: 0,
        processedCount: 0,
        fileInputKey: this.getQueueFileInputKey(queueId) + 1,
        suggestions: { newKeywordNames: new Set<string>(), newAuthorNames: new Set<string>() },
      }
    },
    queueItemsReplaceEmptyCustomDataValue(
      queueId: string,
      data: { assetType: AssetType; elementKey: string; value: any },
      forceReplace = false
    ) {
      const items = this.queues[queueId].items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.assetType !== data.assetType) continue
        if (forceReplace || isUndefined(item.customData[data.elementKey]) || item.customData[data.elementKey] === '') {
          item.customData[data.elementKey] = data.value
        }
      }
    },
    queueItemsReplaceEmptyKeywords(queueId: string, value: any, forceReplace = false) {
      const items = this.queues[queueId].items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (forceReplace || isUndefined(item.keywords) || item.keywords.length === 0) {
          item.keywords = value
        }
      }
    },
    queueItemsReplaceEmptyAuthors(queueId: string, value: any, forceReplace = false) {
      const items = this.queues[queueId].items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (forceReplace || isUndefined(item.authors) || item.authors.length === 0) {
          item.authors = value
        }
      }
    },
    updateAssetMetadata(asset: AssetDetailItemDto) {
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id) {
            item.keywords = asset.keywords
            item.authors = asset.authors
            item.customData = asset.metadata.customData
          }
        })
      }
    },
    reset() {
      this.queues = {}
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadQueuesStore, import.meta.hot))
}
