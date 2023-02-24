import { damClient } from '@/services/api/clients/damClient'
import { HTTP_STATUS_CREATED, HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK } from '@/services/api/statusCodes'
import type { DocId } from '@anzusystems/common-admin'
import { apiAnyRequest, apiFetchList, apiFetchOne } from '@/services/api/anzuApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetApi'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemType } from '@/types/dam/UploadQueue'
import type { FileDownloadLink, VideoFile } from '@/types/dam/File'
import type { ImagePreviewNullable } from '@/types/dam/ImagePreview'
import type { Pagination } from '@anzusystems/common-admin'
import type { FilterBag } from '@anzusystems/common-admin'
import type { DistributionImagePreviewDto } from '@/types/dam/DistributionImagePreviewDto'

const END_POINT = '/adm/v1/video'
const CHUNK_UPLOAD_TIMEOUT = 420

export const fetchVideoFile = (id: DocId) =>
  apiFetchOne<VideoFile>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const uploadStart = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    let url = END_POINT + '/licence/' + item.licenceId
    if (item.type === QueueItemType.SlotFile && item.slotName && item.assetId) {
      url = END_POINT + '/asset/' + item.assetId + '/slot-name/' + item.slotName
    }
    damClient()
      .post(
        url,
        JSON.stringify({
          mimeType: item.file?.type,
          size: item.file?.size,
        })
      )
      .then((res) => {
        if (res.status === HTTP_STATUS_CREATED) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const uploadChunk = (
  item: UploadQueueItem,
  imageId: DocId,
  buffer: string,
  size: number,
  offset: number,
  onUploadProgressCallback: ((progressEvent: any) => void) | undefined = undefined
) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    const url = END_POINT + '/' + imageId + '/chunk'
    formData.append('file', buffer)
    formData.append(
      'chunk',
      JSON.stringify({
        offset: offset,
        size: size,
      })
    )

    damClient(CHUNK_UPLOAD_TIMEOUT)
      .post(url, formData, {
        cancelToken:
          item.chunks[item.currentChunkIndex] && item.chunks[item.currentChunkIndex].cancelTokenSource
            ? item.chunks[item.currentChunkIndex].cancelTokenSource.token
            : undefined,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgressCallback,
      })
      .then((res) => {
        if (res.status === HTTP_STATUS_CREATED) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const uploadFinish = (item: UploadQueueItem, sha: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + item.fileId + '/uploaded'
    damClient()
      .patch(
        url,
        JSON.stringify({
          checksum: sha,
        })
      )
      .then((res) => {
        if (res.status === HTTP_STATUS_OK) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const externalProviderUpload = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/licence/' + item.licenceId + '/external-provider'
    damClient()
      .post(
        url,
        JSON.stringify({
          id: item.externalProviderAssetId,
          externalProvider: item.externalProviderName,
        })
      )
      .then((res) => {
        if (res.status === HTTP_STATUS_CREATED) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const unsetSlot = (videoId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + videoId + '/asset/' + assetId + '/slot-name/' + slotName
    damClient()
      .delete(url)
      .then((res) => {
        if (res.status === HTTP_STATUS_NO_CONTENT) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const deleteVideo = (videoId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + videoId
    damClient()
      .delete(url)
      .then((res) => {
        if (res.status === HTTP_STATUS_NO_CONTENT) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const makeMainFile = (videoId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + videoId + '/asset/' + assetId + '/main'
    damClient()
      .patch(url)
      .then((res) => {
        if (res.status === HTTP_STATUS_OK) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const existingVideoToSlot = (videoId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + videoId + '/asset/' + assetId + '/slot-name/' + slotName
    damClient()
      .patch(url)
      .then((res) => {
        if (res.status === HTTP_STATUS_OK) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const downloadLink = (videoId: DocId) => {
  return new Promise<FileDownloadLink>((resolve, reject) => {
    const url = END_POINT + '/' + videoId + '/download-link'
    damClient()
      .get(url)
      .then((res) => {
        if (res.status === HTTP_STATUS_OK) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const updatePreviewImage = (fileId: DocId, imagePreview: ImagePreviewNullable) => {
  return new Promise((resolve, reject) => {
    damClient()
      .put(
        END_POINT + '/' + fileId,
        JSON.stringify({
          id: fileId,
          imagePreview: imagePreview,
        })
      )
      .then((res) => {
        if (res.status === HTTP_STATUS_OK) {
          resolve(res.data)
        } else {
          //
          reject()
        }
      })
      .catch((err) => {
        //
        reject(err)
      })
  })
}

export const fetchVideoFileDistributionPreviewList = (fileId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<DistributionImagePreviewDto[]>(
    damClient,
    END_POINT + '/:fileId/distribution-preview',
    { fileId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const setVideoFileDistributionPreview = (fileId: DocId, distributionId: DocId) =>
  apiAnyRequest<null, any>(
    damClient,
    'PATCH',
    END_POINT + '/:fileId/distribution-preview/:distributionId',
    { fileId, distributionId },
    null,
    SYSTEM_CORE_DAM,
    ENTITY
  )
