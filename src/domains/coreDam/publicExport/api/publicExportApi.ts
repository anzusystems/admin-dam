import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/public-export'
export const ENTITY = 'publicExport'

export const useFetchPublicExportList = () =>
  useApiFetchList<PublicExport>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT })

export const useCreatePublicExport = () =>
  useApiRequest<PublicExport, PublicExport>({ ...damApiBase, method: 'POST', entity: ENTITY, urlTemplate: END_POINT })

export const useUpdatePublicExport = () =>
  useApiRequest<PublicExport, PublicExport>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchPublicExport = () =>
  useApiRequest<PublicExport, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useDeletePublicExport = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
