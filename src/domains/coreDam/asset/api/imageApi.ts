import { HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK, useApiCommand, useApiRequest } from '@anzusystems/common-admin'
import type { AssetFileDownloadLink, AssetFileImage, AssetFileRoute, DocId } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { fileCommand, fileRequest } from '@/domains/coreDam/asset/api/assetFileRequests'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/image'

export const useFetchImageFile = () =>
  useApiRequest<AssetFileImage, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchImageFile = (id: DocId) => {
  const { execute } = useFetchImageFile()
  return execute({ urlParams: { id } })
}

export const unsetSlot = (imageId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('DELETE', END_POINT + '/' + imageId + '/asset/' + assetId + '/slot-name/' + slotName, [
    HTTP_STATUS_NO_CONTENT,
  ])

export const useDeleteImage = () =>
  useApiCommand<null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const deleteImage = (imageId: DocId) => {
  const { execute } = useDeleteImage()
  return execute({ urlParams: { id: imageId } })
}

export const makeMainFile = (imageId: DocId, assetId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + imageId + '/asset/' + assetId + '/main', [HTTP_STATUS_OK])

export const existingImageToSlot = (imageId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('PATCH', END_POINT + '/' + imageId + '/asset/' + assetId + '/slot-name/' + slotName, [HTTP_STATUS_OK])

export const downloadLink = (imageId: DocId) =>
  fileRequest<AssetFileDownloadLink>('GET', END_POINT + '/' + imageId + '/download-link', [HTTP_STATUS_OK])

// The server answers with the file turned (`ImageFileAdmDetailDto`, as a read of the file).
export const rotateImage = (imageId: DocId, angle: 90 | 270) =>
  fileRequest<AssetFileImage>('PATCH', END_POINT + '/' + imageId + '/rotate/' + angle, [HTTP_STATUS_OK])

export const makePublic = (imageId: DocId) =>
  fileRequest<AssetFileRoute>('PATCH', END_POINT + '/' + imageId + '/make-public', [HTTP_STATUS_OK])

/* The server answers 204 with no body, though it documents a body: either is the change gone through. Nothing reads
 * what it answers with. */
export const makePrivate = (imageId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + imageId + '/make-private', [HTTP_STATUS_OK, HTTP_STATUS_NO_CONTENT])
