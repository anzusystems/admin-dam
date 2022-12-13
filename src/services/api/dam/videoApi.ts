import { damClient } from '@/services/api/clients/damClient'
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from '@/services/api/statusCodes'
import type { DocId } from '@/types/common'
import { apiFetchOne } from '@/services/api/anzuApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetApi'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import type { VideoFile } from '@/types/dam/File'

const END_POINT = '/adm/v1/video'
const CHUNK_UPLOAD_TIMEOUT = 420

export const fetchVideoFile = (id: DocId) =>
  apiFetchOne<VideoFile>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const uploadStart = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/licence/' + item.licenceId
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
