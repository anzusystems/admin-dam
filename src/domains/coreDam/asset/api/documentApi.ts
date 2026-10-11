import type { AssetFileDocument, AssetFileDownloadLink, AssetFileRoute, DocId } from '@anzusystems/common-admin'
import { HTTP_STATUS_NO_CONTENT, HTTP_STATUS_OK, useApiRequest } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
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

export const unsetSlot = (documentId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const deleteDocument = (documentId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId
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

export const makeMainFile = (documentId: DocId, assetId: DocId) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/asset/' + assetId + '/main'
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

export const existingDocumentToSlot = (documentId: DocId, assetId: DocId, slotName: string) => {
  return new Promise((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/asset/' + assetId + '/slot-name/' + slotName
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

export const downloadLink = (documentId: DocId) => {
  return new Promise<AssetFileDownloadLink>((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/download-link'
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

export const makePublic = (documentId: DocId, slug: string) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/make-public'
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

export const makePrivate = (documentId: DocId) => {
  return new Promise<AssetFileRoute>((resolve, reject) => {
    const url = END_POINT + '/' + documentId + '/make-private'
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
