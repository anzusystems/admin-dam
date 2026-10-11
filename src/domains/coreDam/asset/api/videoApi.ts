import {
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_OK,
  useApiCommand,
  useApiFetchList,
  useApiRequest,
} from '@anzusystems/common-admin'
import type {
  AssetFileDownloadLink,
  AssetFileImagePreviewNullable,
  AssetFileVideo,
  DocId,
  FilterConfig,
  FilterData,
  Pagination,
} from '@anzusystems/common-admin'
import type { Ref } from 'vue'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import type { DistributionImagePreviewDto } from '@/domains/coreDam/asset/types/DistributionImagePreviewDto'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/video'

export const useFetchVideoFile = () =>
  useApiRequest<AssetFileVideo, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchVideoFile = (id: DocId) => {
  const { execute } = useFetchVideoFile()
  return execute({ urlParams: { id } })
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
  useApiFetchList<DistributionImagePreviewDto>({
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
  const { execute } = useFetchVideoFileDistributionPreviewList()
  return execute(pagination, filterData, filterConfig, { urlParams: { fileId } })
}

export const useSetVideoFileDistributionPreview = () =>
  useApiCommand<null>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:fileId/distribution-preview/:distributionId',
  })

export const setVideoFileDistributionPreview = (fileId: DocId, distributionId: DocId) => {
  const { execute } = useSetVideoFileDistributionPreview()
  return execute({ urlParams: { fileId, distributionId } })
}
