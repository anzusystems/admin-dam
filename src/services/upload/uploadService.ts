import { ref } from 'vue'
import sha1 from 'js-sha1'
import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'
import { QueueItemStatus } from '@/types/coreDam/UploadQueue'
import { uploadChunk as apiUploadChunk, uploadFinish, uploadStart } from '@/services/api/coreDam/fileApi'
import axios, { type CancelTokenSource } from 'axios'
import { i18n, NEW_LINE_MARK, useErrorHandler, type ValidationResponseData } from '@anzusystems/common-admin'

// const CHUNK_MAX_RETRY = 6
const CHUNK_MAX_RETRY = 4
const SPEED_CHECK_INTERVAL = 1000
const CHUNK_RETRY_INTERVAL = 1000
const CHUNK_RETRY_MULTIPLY = 3

const failUpload = async (queueItem: UploadQueueItem, error: unknown = null) => {
  throw error
}

const finishUpload = async (queueItem: UploadQueueItem, sha: string) => {
  return await uploadFinish(queueItem, sha)
}

const handleValidationErrorMessage = (error: Error | any) => {
  const { t } = i18n.global || i18n
  if (!error || !error.response || !error.response.data) {
    // @ts-ignore
    return t('system.uploadErrors.unknownError')
  }
  const data = error.response.data as ValidationResponseData
  const errorMessages: string[] = []
  for (const [key, values] of Object.entries(data.fields)) {
    switch (key) {
      case 'size':
        errorMessages.push(t('system.uploadErrors.size'))
        break
      case 'offset':
        errorMessages.push(t('system.uploadErrors.offset'))
        break
      case 'mimeType':
        errorMessages.push(t('system.uploadErrors.mimeType'))
        break
      default:
        errorMessages.push(t('system.uploadErrors.systemError') + ': ' + key + ' - ' + values.join(','))
    }
  }
  return errorMessages.length > 0 ? errorMessages.join(NEW_LINE_MARK) : t('system.uploadErrors.unknownError')
}

const readFile = async (index: number, file: File, chunkSize: number): Promise<{ data: string; offset: number }> => {
  return new Promise((resolve, reject) => {
    const offset = index * chunkSize
    const partial = file.slice(offset, offset + chunkSize)
    const reader = new FileReader()
    reader.onload = function (e) {
      if (e.target?.readyState === FileReader.DONE) {
        resolve({ data: e.target.result as string, offset: offset })
      }
    }
    reader.onerror = function (e) {
      reject(e)
    }
    reader.readAsArrayBuffer(partial)
  })
}

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const { isValidationError } = useErrorHandler()

export function useUpload(queueItem: UploadQueueItem, uploadCallback: any = undefined) {
  const chunkTotalCount = ref(0)
  const fileSize = ref(0)

  const progress = ref(0)
  let speedStack: any[] = []
  let lastTimestamp = 0
  let endTimestamp = 0
  let lastLoaded = 0
  const assetAlgo = sha1.create()

  // @ts-ignore
  function progressCallback(progressEvent) {
    const currentStamp = Date.now() / 1000
    if (lastTimestamp === 0) {
      lastTimestamp = currentStamp

      return
    }

    const dataSent = lastLoaded > 0 ? progressEvent.loaded - lastLoaded : progressEvent.loaded
    lastLoaded = progressEvent.total === progressEvent.loaded ? 0 : progressEvent.loaded
    speedStack.push(dataSent / (currentStamp - lastTimestamp))

    lastTimestamp = currentStamp
  }

  const processChunk = async (index: number) => {
    queueItem.currentChunkIndex = index
    const arrayBuffer = await readFile(index, queueItem.file!, queueItem.chunkSize)
    assetAlgo.update(arrayBuffer.data)
    const chunkFile = new File([arrayBuffer.data], queueItem.file!.name)
    const cancelToken = axios.CancelToken
    queueItem.chunks[index] = { cancelTokenSource: cancelToken.source() }

    return await uploadChunkRetryable(chunkFile, arrayBuffer.offset)
  }

  const uploadChunk = async (chunkFile: File, offset: number) => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      apiUploadChunk(queueItem, queueItem.fileId, chunkFile, chunkFile.size, offset, progressCallback)
        .then((result) => {
          resolve(result)
        })
        .catch((exception) => {
          reject(exception)
        })
    })
  }

  const uploadChunkRetryable = async (chunkFile: File, offset: number) => {
    let sleepTime = CHUNK_RETRY_INTERVAL
    let attempt = 0
    do {
      attempt++
      try {
        return await uploadChunk(chunkFile, offset)
      } catch (error) {
        if (isValidationError(error)) {
          attempt = CHUNK_MAX_RETRY
          queueItem.error.message = handleValidationErrorMessage(error)
          return Promise.reject(error)
        }
        await sleep(sleepTime)
        attempt === CHUNK_MAX_RETRY - 1 ? (sleepTime = 1) : (sleepTime *= CHUNK_RETRY_MULTIPLY)
      }
    } while (attempt < CHUNK_MAX_RETRY)
    return Promise.reject('Unable to upload chunk, max tries exceeded')
  }

  function speedCheck() {
    function speedCheckRun() {
      speedStack = speedStack.slice(-15)

      // if (speedStack.length > 7) {
      if (speedStack.length > 0) {
        const avgSpeed = speedStack.reduce((sum, current) => sum + current) / speedStack.length

        uploadCallback(
          progress.value,
          avgSpeed / 1024,
          Math.ceil((fileSize.value / avgSpeed) * (100 - progress.value)) * 10
        )
      }

      if (endTimestamp === 0) {
        setTimeout(function () {
          speedCheckRun()
        }, SPEED_CHECK_INTERVAL)
      }
    }

    speedCheckRun()
  }

  const uploadInit = async () => {
    return new Promise((resolve, reject) => {
      if (!queueItem.file) {
        failUpload(queueItem)
        return
      }
      fileSize.value = queueItem.file ? queueItem.file.size : 0
      chunkTotalCount.value = Math.ceil(fileSize.value / queueItem.chunkSize)
      queueItem.status = QueueItemStatus.Uploading
      // todo
      uploadStart(queueItem)
        .then((res) => {
          queueItem.assetId = res.asset
          queueItem.fileId = res.id
          resolve(queueItem)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  const upload = async () => {
    if (uploadCallback) {
      speedCheck()
    }
    queueItem.chunkTotalCount = chunkTotalCount.value
    for (let i = 0; i < chunkTotalCount.value; i++) {
      await processChunk(i)
      progress.value = ((i + 1) / chunkTotalCount.value) * 100
    }
    endTimestamp = Date.now() / 1000
    if (chunkTotalCount.value === 0) return Promise.reject()
    return await finishUpload(queueItem, assetAlgo.hex())
  }

  return {
    uploadInit,
    upload,
  }
}

export const uploadStop = (cancelTokenSource: CancelTokenSource) => {
  cancelTokenSource.cancel('axios request cancelled')
}
