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
import { fileCommand, fileRequest } from '@/domains/coreDam/asset/api/assetFileRequests'
import type { DistributionImagePreviewDto } from '@/domains/coreDam/asset/types/DistributionImagePreviewDto'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/video'

export const useFetchVideoFile = () =>
  useApiRequest<AssetFileVideo, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const fetchVideoFile = (id: DocId) => {
  const { execute } = useFetchVideoFile()
  return execute({ urlParams: { id } })
}

export const unsetSlot = (videoId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('DELETE', END_POINT + '/' + videoId + '/asset/' + assetId + '/slot-name/' + slotName, [
    HTTP_STATUS_NO_CONTENT,
  ])

export const deleteVideo = (videoId: DocId) =>
  fileCommand('DELETE', END_POINT + '/' + videoId, [HTTP_STATUS_NO_CONTENT])

export const makeMainFile = (videoId: DocId, assetId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + videoId + '/asset/' + assetId + '/main', [HTTP_STATUS_OK])

export const existingVideoToSlot = (videoId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('PATCH', END_POINT + '/' + videoId + '/asset/' + assetId + '/slot-name/' + slotName, [HTTP_STATUS_OK])

export const downloadLink = (videoId: DocId) =>
  fileRequest<AssetFileDownloadLink>('GET', END_POINT + '/' + videoId + '/download-link', [HTTP_STATUS_OK])

export const updatePreviewImage = (fileId: DocId, imagePreview: AssetFileImagePreviewNullable) =>
  fileCommand('PUT', END_POINT + '/' + fileId, [HTTP_STATUS_OK], { id: fileId, imagePreview })

export const useFetchVideoFileDistributionPreviewList = () =>
  useApiFetchList<DistributionImagePreviewDto>({
    ...damApiBase,
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
    ...damApiBase,
    method: 'PATCH',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:fileId/distribution-preview/:distributionId',
  })

export const setVideoFileDistributionPreview = (fileId: DocId, distributionId: DocId) => {
  const { execute } = useSetVideoFileDistributionPreview()
  return execute({ urlParams: { fileId, distributionId } })
}
