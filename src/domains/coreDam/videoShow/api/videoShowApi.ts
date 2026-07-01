import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'

const END_POINT = '/adm/v1/video-show'
export const ENTITY = 'videoShow'

export const useFetchVideoShowListByExtSystem = () =>
  useApiFetchList<VideoShow[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/ext-system/:extSystemId',
  })

export const useFetchVideoShowListByLicence = () =>
  useApiFetchList<VideoShow[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/licence/:licenceId',
  })

export const useFetchVideoShowListByIds = () =>
  useApiFetchByIds<VideoShow[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/ext-system/:extSystemId',
  })

export const useCreateVideoShow = () =>
  useApiRequest<VideoShow, VideoShow>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateVideoShow = () =>
  useApiRequest<VideoShow, VideoShow>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchVideoShow = () =>
  useApiRequest<VideoShow, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteVideoShow = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
