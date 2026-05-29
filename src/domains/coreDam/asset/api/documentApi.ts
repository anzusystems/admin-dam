import { damClient } from '@/shared/apiClients/damClient'
import type {
  AssetFileDocument,
  AssetFileDownloadLink,
  AssetFileRoute,
  UploadQueueItem,
} from '@anzusystems/common-admin'
import {
  damFileTypeFix,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NO_CONTENT,
  UploadQueueItemType,
} from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import type { AxiosProgressEvent } from 'axios'

const END_POINT = '/adm/v1/document'
const CHUNK_UPLOAD_TIMEOUT = 420

export const useFetchDocumentFile = () =>
  useApiRequest<AssetFileDocument, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchDocumentFile = (id: DocId) => {
  const { executeRequest } = useFetchDocumentFile()
  return executeRequest({ urlParams: { id } })
}

export const uploadStart = (item: UploadQueueItem) => {
  return new Promise((resolve, reject) => {
    let url = END_POINT + '/licence/' + item.licenceId
    if (item.type === UploadQueueItemType.SlotFile && item.slotName && item.assetId) {
      url = END_POINT + '/asset/' + item.assetId + '/slot-name/' + item.slotName
    }
    damClient()
      .post(
        url,
        JSON.stringify({
          mimeType: damFileTypeFix(item.file),
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
  onUploadProgressCallback: ((progressEvent: AxiosProgressEvent) => void) | undefined = undefined
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
        cancelToken: item.latestChunkCancelToken ? item.latestChunkCancelToken.token : undefined,
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

export const unsetSlot = (documentId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const deleteDocument = (documentId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId
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

export const makeMainFile = (documentId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/asset/' + assetId + '/main'
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

export const existingDocumentToSlot = (documentId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const downloadLink = (documentId: DocId) => {
  return new Promise<AssetFileDownloadLink>((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/download-link'
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

export const makePublic = (documentId: DocId, slug: string) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/make-public'
    damClient()
      .patch(
        url,
        JSON.stringify({
          slug,
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

export const makePrivate = (documentId: DocId) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/make-private'
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
