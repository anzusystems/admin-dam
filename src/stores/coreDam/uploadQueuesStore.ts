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
import type { AssetFileFailReasonType, DamAssetTypeType, UploadQueueItemStatusType } from '@anzusystems/common-admin'
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
  useUploadQueueItemFactory
} from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'

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
      return (queueId: string, status: UploadQueueItemStatusType) => {
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
        const types: Array<DamAssetTypeType> = []
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
      const { getAuthorConflicts } = useAssetSuggestions()
      const res = await fetchAssetListByIds(assetIds, licenceId)
      for (let i = 0; i < res.length; i++) {
        const foundIndex = this.queues[queueId].items.findIndex((item) => item.assetId === res[i].id)
        if (foundIndex > -1) {
          this.queues[queueId].items[foundIndex].keywords = res[i].keywords
          this.queues[queueId].items[foundIndex].authors = res[i].authors
          this.queues[queueId].items[foundIndex].customData = res[i].metadata.customData
          this.queues[queueId].items[foundIndex].status = UploadQueueItemStatus.Uploaded
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
      const waitingItems = this.getQueueItemsByStatus(queueId, UploadQueueItemStatus.Waiting)
      if (waitingItems.length === 0) {
        //upload finished
        return
      }
      const uploadingCount = this.getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploading).length
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
      const currentItems = this.getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploading)
      this.queues[queueId].items.forEach((item) => {
        item.status = UploadQueueItemStatus.Stop
      })
      if (currentItems.length > 0) {
        currentItems.forEach((item) => {
          if (item.latestChunkCancelToken) {
            uploadStop(item.latestChunkCancelToken)
          }
        })
      }
      this.clearQueue(queueId)
      this.forceReloadFileInput(queueId)
    },
    async stopItemUpload(queueId: string, queueItem: UploadQueueItem, index: number) {
      if (!this.queues[queueId] || this.queues[queueId].items.length === 0) return
      queueItem.status = UploadQueueItemStatus.Stop
      if (queueItem.latestChunkCancelToken) {
        uploadStop(queueItem.latestChunkCancelToken)
      }
      await this.removeByIndex(queueId, index)
      this.processUpload(queueId)
    },
    async queueItemUploadStart(item: UploadQueueItem, queueId: string) {
      // external provider asset import
      if (item.type === UploadQueueItemType.ExternalProviderAsset) {
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
        item.status = UploadQueueItemStatus.Failed
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
            item.status = UploadQueueItemStatus.Uploaded
            item.assetStatus = asset.attributes.assetStatus
            if (asset.mainFile.links?.image_detail) {
              item.imagePreview = asset.mainFile.links.image_detail
            }
            item.mainFileSingleUse = asset.mainFileSingleUse
            this.processUpload(queueId)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
    },
    async queueItemFailed(assetId: DocId, failReason: AssetFileFailReasonType) {
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id) {
            clearTimeout(item.notificationFallbackTimer)
            item.error.hasError = true
            item.status = UploadQueueItemStatus.Failed
            item.error.assetFileFailReason = failReason
            item.canEditMetadata = false
            this.processUpload(queueId)
          }
        })
        this.recalculateQueueCounts(queueId)
      }
    },
    async queueItemMetadataProcessed(assetId: DocId) {
      const { updateNewNames, getAuthorConflicts } = useAssetSuggestions()
      const assetDetailStore = useAssetDetailStore()
      const asset = await fetchAsset(assetId)
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
          if (item.assetId === asset.id && item.type !== UploadQueueItemType.SlotFile) {
            item.keywords = asset.keywords
            item.authors = asset.authors
            item.customData = asset.metadata.customData
            item.mainFileSingleUse = asset.mainFileSingleUse
            updateNewNames(asset.metadata.authorSuggestions, this.queues[queueId].suggestions.newAuthorNames)
            updateNewNames(asset.metadata.keywordSuggestions, this.queues[queueId].suggestions.newKeywordNames)
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
        this.recalculateQueueCounts(queueId)
      }
      fetchCachedAuthors()
      fetchCachedKeywords()
    },
    async queueItemDuplicate(
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
      for (const queueId in this.queues) {
        this.queues[queueId].items.forEach((item) => {
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
        this.getQueueItemsByStatus(queueId, UploadQueueItemStatus.Uploaded).length +
        this.getQueueItemsByStatus(queueId, UploadQueueItemStatus.Failed).length
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
      data: { assetType: DamAssetTypeType; elementProperty: string; value: any },
      forceReplace = false
    ) {
      const items = this.queues[queueId].items
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
            item.mainFileSingleUse = asset.mainFileSingleUse
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
