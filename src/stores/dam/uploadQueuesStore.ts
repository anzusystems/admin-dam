import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DocId } from '@anzusystems/common-admin'
import { uploadStop, useUpload } from '@/services/upload/uploadService'
import { fetchImageFile } from '@/services/api/dam/imageApi'
import { fetchAsset, fetchAssetListByIds } from '@/services/api/dam/assetApi'
import type { UploadQueue, UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemStatus, QueueItemType } from '@/types/dam/UploadQueue'
import type { AssetFileNullable } from '@/types/dam/File'
import type { AssetSearchListItemDto } from '@/types/dam/Asset'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import { getAssetTypeByMimeType } from '@/services/upload/mimeTypeService'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { fetchAudioFile } from '@/services/api/dam/audioApi'
import { fetchVideoFile } from '@/services/api/dam/videoApi'
import { fetchDocumentFile } from '@/services/api/dam/documentApi'
import { loadLazyKeyword } from '@/views/dam/keyword/composables/lazyKeyword'
import { loadLazyAuthor } from '@/views/dam/author/composables/lazyAuthor'
import { getValues } from '@/utils/object'
import { isUndefined } from '@/utils/common'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/dam/AssetExternalProvider'
import { externalProviderImport } from '@/services/upload/externalProviderImportService'
import { useExternalProviders } from '@/composables/system/externalProviders'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'

interface State {
  queues: { [queueId: string]: UploadQueue }
  uploadSpeed: null | number
}

const QUEUE_MAX_PARALLEL_UPLOADS = 2
const CHUNK_SIZE = 10485760

export const useUploadQueuesStore = defineStore('damUploadQueuesStore', {
  state: (): State => ({
    queues: {},
    uploadSpeed: null,
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
        const type = getAssetTypeByMimeType(file.type)
        if (!type) continue
        const queueItem: UploadQueueItem = {
          key: 'file_' + file.name,
          type: QueueItemType.File,
          file: file,
          status: QueueItemStatus.Waiting,
          isDuplicate: false,
          duplicateAssetId: null,
          assetType: type,
          assetStatus: AssetStatus.Default,
          displayTitle: file.name,
          assetId: null,
          fileId: null,
          externalProviderAssetId: null,
          externalProviderName: null,
          externalProviderMetadata: {},
          chunks: [],
          chunkSize: CHUNK_SIZE,
          currentChunkIndex: 0,
          chunkTotalCount: 0,
          licenceId: currentAssetLicenceId.value,
          imagePreview: undefined,
          keywords: [],
          authors: [],
          keywordSuggestions: {},
          authorSuggestions: {},
          customData: {},
          progress: {
            remainingTime: null,
            progressPercent: null,
          },
          canEditMetadata: false,
          error: {
            hasError: false,
            message: '',
          },
          notificationFallbackTimer: undefined,
          notificationFallbackTry: 1,
          slotName: null,
        }

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
        const queueItem: UploadQueueItem = {
          key: 'file_' + file.name,
          type: QueueItemType.SlotFile,
          file: file,
          status: QueueItemStatus.Waiting,
          isDuplicate: false,
          duplicateAssetId: null,
          assetType: assetType,
          assetStatus: AssetStatus.Default,
          displayTitle: file.name,
          assetId: assetId,
          fileId: null,
          externalProviderAssetId: null,
          externalProviderName: null,
          externalProviderMetadata: {},
          chunks: [],
          chunkSize: CHUNK_SIZE,
          currentChunkIndex: 0,
          chunkTotalCount: 0,
          licenceId: currentAssetLicenceId.value,
          imagePreview: undefined,
          keywords: [],
          authors: [],
          keywordSuggestions: {},
          authorSuggestions: {},
          customData: {},
          progress: {
            remainingTime: null,
            progressPercent: null,
          },
          canEditMetadata: false,
          error: {
            hasError: false,
            message: '',
          },
          notificationFallbackTimer: undefined,
          notificationFallbackTry: 1,
          slotName: slotName,
        }

        this.createQueue(queueId)
        this.addQueueItem(queueId, queueItem)
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
    },
    async addByAssets(queueId: string, assets: AssetSearchListItemDto[]) {
      const { fetchLazyKeyword, addToLazyKeywordBuffer } = loadLazyKeyword()
      const { fetchLazyAuthor, addToLazyAuthorBuffer } = loadLazyAuthor()
      const { currentAssetLicenceId } = useCurrentAssetLicence()
      const assetIds: DocId[] = []
      for await (const asset of assets) {
        assetIds.push(asset.id)
        const queueItem: UploadQueueItem = {
          key: 'asset_' + asset.id,
          type: QueueItemType.Asset,
          file: null,
          status: QueueItemStatus.Loading,
          isDuplicate: false,
          duplicateAssetId: null,
          assetType: asset.attributes.assetType,
          assetStatus: asset.attributes.assetStatus,
          displayTitle: asset.texts.displayTitle,
          assetId: asset.id,
          fileId: asset.mainFile ? asset.mainFile.id : null,
          externalProviderAssetId: null,
          externalProviderName: null,
          externalProviderMetadata: {},
          keywords: [],
          authors: [],
          keywordSuggestions: {},
          authorSuggestions: {},
          customData: {},
          chunks: [],
          chunkSize: CHUNK_SIZE,
          currentChunkIndex: 0,
          chunkTotalCount: 0,
          licenceId: currentAssetLicenceId.value,
          imagePreview: asset.mainFile && asset.mainFile.links ? asset.mainFile.links.image_list : undefined,
          progress: {
            remainingTime: null,
            progressPercent: null,
          },
          canEditMetadata: false,
          error: {
            hasError: false,
            message: '',
          },
          notificationFallbackTimer: undefined,
          notificationFallbackTry: 1,
          slotName: null,
        }

        this.addToBufferLazyValues(queueItem, addToLazyAuthorBuffer, addToLazyKeywordBuffer)
        this.createQueue(queueId)
        this.addQueueItem(queueId, queueItem)
        this.recalculateQueueCounts(queueId)
        this.processUpload(queueId)
      }
      this.fetchLazyAdditionalMetadata(queueId, currentAssetLicenceId.value, assetIds)
      await fetchLazyKeyword()
      await fetchLazyAuthor()
    },
    async addByExternalProviderAsset(queueId: string, assets: AssetExternalProviderListDto[], importAsset = false) {
      const { currentAssetLicenceId } = useCurrentAssetLicence()
      const { activeExternalProvider } = useExternalProviders()
      for await (const asset of assets) {
        const queueItem: UploadQueueItem = {
          key: 'externalProviderAsset_' + asset.id,
          type: QueueItemType.ExternalProviderAsset,
          file: null,
          status: importAsset ? QueueItemStatus.Waiting : QueueItemStatus.Uploaded,
          isDuplicate: false,
          duplicateAssetId: null,
          assetType: asset.attributes.assetType,
          assetStatus: AssetStatus.WithFile,
          displayTitle: asset.texts.displayTitle,
          assetId: null,
          fileId: null,
          externalProviderAssetId: asset.id,
          externalProviderName: activeExternalProvider.value,
          externalProviderMetadata: asset.metadata,
          keywords: [],
          authors: [],
          keywordSuggestions: {},
          authorSuggestions: {},
          customData: {},
          chunks: [],
          chunkSize: CHUNK_SIZE,
          currentChunkIndex: 0,
          chunkTotalCount: 0,
          licenceId: currentAssetLicenceId.value,
          imagePreview: {
            width: 0,
            height: 0,
            requestedWidth: 0,
            requestedHeight: 0,
            url: asset.url,
            title: '',
          },
          progress: {
            remainingTime: null,
            progressPercent: null,
          },
          canEditMetadata: false,
          error: {
            hasError: false,
            message: '',
          },
          notificationFallbackTimer: undefined,
          notificationFallbackTry: 1,
          slotName: null,
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
          this.queues[queueId].items[foundIndex].authorSuggestions = res[i].metadata.authorSuggestions
          this.queues[queueId].items[foundIndex].keywordSuggestions = res[i].metadata.keywordSuggestions
          this.queues[queueId].items[foundIndex].customData = res[i].metadata.customData
          this.queues[queueId].items[foundIndex].status = QueueItemStatus.Uploaded
          this.queues[queueId].items[foundIndex].canEditMetadata = true
        }
      }
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
        this.queues[queueId] = { items: [], totalCount: 0, processedCount: 0, fileInputKey: 0 }
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
    async queueItemFailed(assetId: DocId) {
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id) {
            item.error.hasError = true
            item.status = QueueItemStatus.Failed
            item.canEditMetadata = false
            this.processUpload(queueId)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
    },
    async queueItemMetadataProcessed(assetId: DocId) {
      const { fetchLazyKeyword, addToLazyKeywordBuffer } = loadLazyKeyword()
      const { fetchLazyAuthor, addToLazyAuthorBuffer } = loadLazyAuthor()
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id && item.type !== QueueItemType.SlotFile) {
            // todo check slots
            item.keywords = asset.keywords
            item.authors = asset.authors
            item.keywordSuggestions = asset.metadata.keywordSuggestions
            item.authorSuggestions = asset.metadata.authorSuggestions
            item.customData = asset.metadata.customData
            item.canEditMetadata = true
            this.addToBufferLazyValues(item, addToLazyAuthorBuffer, addToLazyKeywordBuffer)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
      fetchLazyKeyword()
      fetchLazyAuthor()
    },
    async queueItemDuplicate(assetId: DocId, originAssetFile: DocId, assetType: AssetType) {
      // @todo if is duplicate metadata are empty, what to do because we load image file and not asset, product question
      let file: null | AssetFileNullable = null
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
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === assetId) {
            item.isDuplicate = true
            item.status = QueueItemStatus.Uploaded
            item.canEditMetadata = true
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
    addToBufferLazyValues(
      item: UploadQueueItem,
      addLazyAuthor: (id: string) => void,
      addLazyKeyword: (id: string) => void
    ) {
      item.keywords.forEach((id) => addLazyKeyword(id))
      item.authors.forEach((id) => addLazyAuthor(id))
      getValues(item.authorSuggestions)
        .filter((ids) => ids.length > 1)
        .forEach((ids) => ids.filter((id) => addLazyAuthor(id)))
    },
    setUploadSpeed(item: UploadQueueItem, progress: number, speed: number, estimate: number) {
      item.progress.progressPercent = progress
      item.progress.remainingTime = estimate
      this.uploadSpeed = speed
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
    reset() {
      this.queues = {}
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadQueuesStore, import.meta.hot))
}
