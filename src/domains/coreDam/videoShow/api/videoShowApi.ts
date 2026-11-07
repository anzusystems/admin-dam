import { useApiCommand, useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/video-show'
export const ENTITY = 'videoShow'

export const useFetchVideoShowListByExtSystem = () =>
  useApiFetchList<VideoShow>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/ext-system/:extSystemId' })

export const useFetchVideoShowListByLicence = () =>
  useApiFetchList<VideoShow>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/licence/:licenceId' })

export const useFetchVideoShowListByIds = () =>
  useApiFetchByIds<VideoShow>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/ext-system/:extSystemId' })

export const useCreateVideoShow = () =>
  useApiRequest<VideoShow, VideoShow>({ ...damApiBase, method: 'POST', entity: ENTITY, urlTemplate: END_POINT })

export const useUpdateVideoShow = () =>
  useApiRequest<VideoShow, VideoShow>({ ...damApiBase, method: 'PUT', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useFetchVideoShow = () =>
  useApiRequest<VideoShow, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useDeleteVideoShow = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
