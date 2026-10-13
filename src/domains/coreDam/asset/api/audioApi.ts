import type { AssetFileAudio, AssetFileDownloadLink, AssetFileRoute, DocId } from '@anzusystems/common-admin'
import { HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK, useApiRequest } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/audio'

export const useFetchAudioFile = () =>
  useApiRequest<AssetFileAudio, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchAudioFile = (id: DocId) => {
  const { execute } = useFetchAudioFile()
  return execute({ urlParams: { id } })
}

export const unsetSlot = (audioId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + audioId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const deleteAudio = (audioId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + audioId
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

export const makeMainFile = (audioId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + audioId + '/asset/' + assetId + '/main'
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

export const existingAudioToSlot = (audioId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + audioId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const downloadLink = (audioId: DocId) => {
  return new Promise<AssetFileDownloadLink>((resolve, reject) => {
    const url = END_POINT + '/' + audioId + '/download-link'
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

export const makePublic = (audioId: DocId, slug: string) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    const url = END_POINT + '/' + audioId + '/make-public'
    damClient()
      .patch(
        url,
        JSON.stringify({
          slug,
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

// The server answers 200 with the audio file, where an image and a document get 204: either is the change gone through.
export const makePrivate = (audioId: DocId) => {
  return new Promise<void>((resolve, reject) => {
    const url = END_POINT + '/' + audioId + '/make-private'
    damClient()
      .patch(url)
      .then((res) => {
        if (res.status === HTTP_STATUS_OK || res.status === HTTP_STATUS_NO_CONTENT) {
          resolve()
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
