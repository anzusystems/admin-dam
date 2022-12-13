// @ts-ignore
import sha1 from 'js-sha1'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'

// todo check, probably will be removed
export const calculatePartialChecksum = (queueItem: UploadQueueItem, length: number) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = (evt) => {
      if (evt.target?.readyState === FileReader.DONE) {
        const assetAlgo = sha1.create()
        assetAlgo.update(reader.result)
        resolve(assetAlgo.hex())
      }
    }

    const partial = queueItem.file!.slice(0, length)
    reader.readAsArrayBuffer(partial)
  })
}

export const calculateUploadQueueItemFileChecksum = (queueItem: UploadQueueItem, length = -1) => {
  return new Promise((resolve, reject) => {
    if (!queueItem.file) {
      reject()
      return
    }
    const reader = new FileReader()
    reader.onloadend = (evt) => {
      if (evt.target?.readyState === FileReader.DONE) {
        const assetAlgo = sha1.create()
        assetAlgo.update(reader.result)
        resolve(assetAlgo.hex())
      }
    }

    if (length === -1) {
      reader.readAsArrayBuffer(queueItem.file)
    } else {
      reader.readAsArrayBuffer(queueItem.file.slice(0, length))
    }
  })
}
