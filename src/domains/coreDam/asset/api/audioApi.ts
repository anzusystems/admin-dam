import type { AssetFileAudio, AssetFileDownloadLink, AssetFileRoute, DocId } from '@anzusystems/common-admin'
import { HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK, useApiRequest } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { ROUTE_VALIDATION_ENTITY, fileCommand, fileRequest } from '@/domains/coreDam/asset/api/assetFileRequests'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/audio'

export const useFetchAudioFile = () =>
  useApiRequest<AssetFileAudio, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const fetchAudioFile = (id: DocId) => {
  const { execute } = useFetchAudioFile()
  return execute({ urlParams: { id } })
}

export const unsetSlot = (audioId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('DELETE', END_POINT + '/' + audioId + '/asset/' + assetId + '/slot-name/' + slotName, [
    HTTP_STATUS_NO_CONTENT,
  ])

export const deleteAudio = (audioId: DocId) =>
  fileCommand('DELETE', END_POINT + '/' + audioId, [HTTP_STATUS_NO_CONTENT])

export const makeMainFile = (audioId: DocId, assetId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + audioId + '/asset/' + assetId + '/main', [HTTP_STATUS_OK])

export const existingAudioToSlot = (audioId: DocId, assetId: DocId, slotName: string) =>
  fileCommand('PATCH', END_POINT + '/' + audioId + '/asset/' + assetId + '/slot-name/' + slotName, [HTTP_STATUS_OK])

export const downloadLink = (audioId: DocId) =>
  fileRequest<AssetFileDownloadLink>('GET', END_POINT + '/' + audioId + '/download-link', [HTTP_STATUS_OK])

export const makePublic = (audioId: DocId, slug: string) =>
  fileRequest<AssetFileRoute>(
    'PATCH',
    END_POINT + '/' + audioId + '/make-public',
    [HTTP_STATUS_OK],
    { slug },
    ROUTE_VALIDATION_ENTITY
  )

// The server returns 200 with the audio file, while image and document return 204. Both mean success.
export const makePrivate = (audioId: DocId) =>
  fileCommand('PATCH', END_POINT + '/' + audioId + '/make-private', [HTTP_STATUS_OK, HTTP_STATUS_NO_CONTENT])
