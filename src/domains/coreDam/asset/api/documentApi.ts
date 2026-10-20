import type { AssetFileDocument, AssetFileDownloadLink, AssetFileRoute, DocId } from '@anzusystems/common-admin'
import { HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK, useApiRequest } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { ROUTE_VALIDATION_ENTITY, fileCommand, fileRequest } from '@/domains/coreDam/asset/api/assetFileRequests'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/document'

export const useFetchDocumentFile = () =>
  useApiRequest<AssetFileDocument, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchDocumentFile = (id: DocId) => {
  const { execute } = useFetchDocumentFile()
  return execute({ urlParams: { id } })
}

export const unsetSlot = (documentId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('DELETE', END_POINT + '/' + documentId + '/asset/' + assetId + '/slot-name/' + slotName, [
    HTTP_STATUS_NO_CONTENT,
  ])

export const deleteDocument = (documentId: DocId) =>
  fileCommand('DELETE', END_POINT + '/' + documentId, [HTTP_STATUS_NO_CONTENT])

export const makeMainFile = (documentId: DocId, assetId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + documentId + '/asset/' + assetId + '/main', [HTTP_STATUS_OK])

export const existingDocumentToSlot = (documentId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('PATCH', END_POINT + '/' + documentId + '/asset/' + assetId + '/slot-name/' + slotName, [HTTP_STATUS_OK])

export const downloadLink = (documentId: DocId) =>
  fileRequest<AssetFileDownloadLink>('GET', END_POINT + '/' + documentId + '/download-link', [HTTP_STATUS_OK])

export const makePublic = (documentId: DocId, slug: string) =>
  fileRequest<AssetFileRoute>(
    'PATCH',
    END_POINT + '/' + documentId + '/make-public',
    [HTTP_STATUS_OK],
    { slug },
    ROUTE_VALIDATION_ENTITY
  )

// As for an image: 204 with no body today, a body documented. Either is the change gone through.
export const makePrivate = (documentId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + documentId + '/make-private', [HTTP_STATUS_OK, HTTP_STATUS_NO_CONTENT])
