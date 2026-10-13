import { HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK, useApiCommand, useApiRequest } from '@anzusystems/common-admin'
import type { AssetFileDownloadLink, AssetFileImage, AssetFileRoute, DocId } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
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

export const unsetSlot = (imageId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const makeMainFile = (imageId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/asset/' + assetId + '/main'
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

export const existingImageToSlot = (imageId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const downloadLink = (imageId: DocId) => {
  return new Promise<AssetFileDownloadLink>((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/download-link'
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

export const rotateImage = (imageId: DocId, angle: 90 | 270) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/rotate/' + angle
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

export const makePublic = (imageId: DocId) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/make-public'
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

/* The server answers 204 with no body, though it documents a body: either is the change gone through. Nothing reads
 * what it answers with. */
export const makePrivate = (imageId: DocId) => {
  return new Promise<void>((resolve, reject) => {
    const url = END_POINT + '/' + imageId + '/make-private'
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
