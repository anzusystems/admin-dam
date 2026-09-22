import { damClient } from '@/shared/apiClients/damClient'
import type {
  AssetFileDownloadLink,
  AssetFileImagePreviewNullable,
  AssetFileVideo,
  UploadQueueItem,
} from '@anzusystems/common-admin'
import {
  damFileTypeFix,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NO_CONTENT,
  UploadQueueItemType,
} from '@anzusystems/common-admin'
import {
  type FilterConfig,
  type FilterData,
  type Pagination,
  useApiFetchList,
  useApiRequest,
} from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import type { DistributionImagePreviewDto } from '@/domains/coreDam/asset/types/DistributionImagePreviewDto'
import type { AxiosProgressEvent } from 'axios'
import type { Ref } from 'vue'

const END_POINT = '/adm/v1/video'
const CHUNK_UPLOAD_TIMEOUT = 420

export const useFetchVideoFile = () =>
  useApiRequest<AssetFileVideo, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchVideoFile = (id: DocId) => {
  const { executeRequest } = useFetchVideoFile()
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
  return new Promise<AssetFileDownloadLink>((resolve, reject) => {
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

export const updatePreviewImage = (fileId: DocId, imagePreview: AssetFileImagePreviewNullable) => {
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

export const useFetchVideoFileDistributionPreviewList = () =>
  useApiFetchList<DistributionImagePreviewDto[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:fileId/distribution-preview',
  })

export const fetchVideoFileDistributionPreviewList = (
  fileId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { executeFetch } = useFetchVideoFileDistributionPreviewList()
  return executeFetch(pagination, filterData, filterConfig, { urlParams: { fileId } })
}

export const useSetVideoFileDistributionPreview = () =>
  useApiRequest<null, null>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:fileId/distribution-preview/:distributionId',
  })

export const setVideoFileDistributionPreview = (fileId: DocId, distributionId: DocId) => {
  const { executeRequest } = useSetVideoFileDistributionPreview()
  return executeRequest({ urlParams: { fileId, distributionId } })
}
