import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'

const END_POINT = '/adm/v1/public-export'
export const ENTITY = 'publicExport'

export const useFetchPublicExportList = () =>
  useApiFetchList<PublicExport[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useCreatePublicExport = () =>
  useApiRequest<PublicExport, PublicExport>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdatePublicExport = () =>
  useApiRequest<PublicExport, PublicExport>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchPublicExport = () =>
  useApiRequest<PublicExport, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeletePublicExport = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
