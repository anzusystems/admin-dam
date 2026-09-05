import {
  type AnzuApiValidationResponseData,
  axiosErrorResponseHasForbiddenOperationData,
  axiosErrorResponseHasValidationData,
  i18n,
  NEW_LINE_MARK,
  type UploadQueueItem,
  UploadQueueItemStatus,
  useDamUploadChunkSize,
} from '@anzusystems/common-admin'
import { uploadChunk as apiUploadChunk, uploadFinish, uploadStart } from '@/domains/coreDam/asset/api/fileApi'
import axios, { type CancelTokenSource, isAxiosError } from 'axios'
import { envConfig } from '@/shared/EnvConfigService'
import rusha from 'rusha'

// const CHUNK_MAX_RETRY = 6
const CHUNK_MAX_RETRY = 4
const SPEED_CHECK_INTERVAL = 1000
const CHUNK_RETRY_INTERVAL = 1000
const CHUNK_RETRY_MULTIPLY = 3

// Not exported: the store decides via `item.status === Stop`, since a stop during an axios
// request surfaces as a cancel error instead.
const UPLOAD_STOPPED = 'upload stopped'

const failUpload = async (queueItem: UploadQueueItem, error: unknown = null) => {
  throw error
}

const finishUpload = async (queueItem: UploadQueueItem, sha: string) => {
  return await uploadFinish(queueItem, sha)
}

const handleValidationErrorMessage = (error: Error) => {
  const { t } = i18n.global || i18n
  if (!isAxiosError(error) || !error.response || !error.response.data) {
    // @ts-ignore
    return t('system.uploadErrors.unknownError')
  }
  const data = error.response.data as AnzuApiValidationResponseData
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
        // @ts-ignore
        errorMessages.push(t('system.uploadErrors.systemError') + ': ' + key + ' - ' + values.join(','))
    }
  }
  return errorMessages.length > 0 ? errorMessages.join(NEW_LINE_MARK) : t('system.uploadErrors.unknownError')
}

const handleForbiddenOperationMessage = (error: Error) => {
  const { t, te } = i18n.global || i18n
  const detail = isAxiosError(error) ? (error.response?.data as { detail?: string })?.detail : undefined
  const key = 'error.apiForbiddenOperation.' + detail

  return detail && te(key) ? t(key) : t('error.apiForbiddenOperation.noTranslation')
}

/**
 * A rejected upload carries the reason in the API response; without this the queue item only gets
 * a red icon and the user never learns why the file was refused.
 */
export const resolveUploadErrorMessage = (error: unknown) => {
  const { t } = i18n.global || i18n

  if (axiosErrorResponseHasForbiddenOperationData(error as Error)) {
    return handleForbiddenOperationMessage(error as Error)
  }
  if (axiosErrorResponseHasValidationData(error as Error)) {
    return handleValidationErrorMessage(error as Error)
  }

  return t('system.uploadErrors.unknownError')
}

const readFile = async (offset: number, size: number, file: File): Promise<{ data: string; offset: number }> => {
  return new Promise((resolve, reject) => {
    const partial = file.slice(offset, offset + size)
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

export function useUpload(
  queueItem: UploadQueueItem,
  uploadCallback: ((progress: number, speed: number, estimate: number) => void) | undefined = undefined
) {
  const fileSize = ref(0)

  const progress = ref(0)

  let speedStack: number[] = []
  let lastTimestamp = 0
  let endTimestamp = 0
  let lastLoaded = 0
  let speedCheckTimerId: ReturnType<typeof setTimeout> | undefined = undefined
  // Checked at every point the chunk loop can be interrupted; the cancel token covers only the
  // in-flight chunk.
  let stopped = false
  const sha = rusha.createHash()
  const { updateChunkSize, lastChunkSize } = useDamUploadChunkSize(envConfig.dam.apiTimeout)

  const getCurrentTimestamp = () => {
    return Date.now() / 1000
  }

  // @ts-ignore
  function progressCallback(progressEvent) {
    const currentStamp = getCurrentTimestamp()
    if (lastTimestamp === 0) {
      lastTimestamp = currentStamp

      return
    }

    const dataSent = lastLoaded > 0 ? progressEvent.loaded - lastLoaded : progressEvent.loaded
    lastLoaded = progressEvent.total === progressEvent.loaded ? 0 : progressEvent.loaded
    speedStack.push(dataSent / (currentStamp - lastTimestamp))

    lastTimestamp = currentStamp
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

  const processAndUploadChunk = async (offset: number): Promise<File> => {
    if (stopped) return Promise.reject(UPLOAD_STOPPED)
    updateChunkSize(queueItem.progress.speed)
    let arrayBuffer = await readFile(offset, lastChunkSize.value, queueItem.file!)
    if (stopped) return Promise.reject(UPLOAD_STOPPED)
    let chunkFile = new File([arrayBuffer.data], queueItem.file!.name)

    queueItem.currentChunkIndex = offset
    const cancelToken = axios.CancelToken
    queueItem.latestChunkCancelToken = cancelToken.source()

    let sleepTime = CHUNK_RETRY_INTERVAL
    let attempt = 0
    do {
      attempt++
      try {
        await uploadChunk(chunkFile, offset)
        sha.update(arrayBuffer.data)

        return chunkFile
      } catch (error) {
        // in error recompute
        if (axiosErrorResponseHasValidationData(error as Error)) {
          attempt = CHUNK_MAX_RETRY
          queueItem.error.message = handleValidationErrorMessage(error as Error)
          return Promise.reject(error)
        }

        if (updateChunkSize(queueItem.progress.speed)) {
          arrayBuffer = await readFile(offset, lastChunkSize.value, queueItem.file!)
          chunkFile = new File([arrayBuffer.data], queueItem.file!.name)
        }

        await sleep(sleepTime)
        if (stopped) return Promise.reject(UPLOAD_STOPPED)
        attempt === CHUNK_MAX_RETRY - 1 ? (sleepTime = 1) : (sleepTime *= CHUNK_RETRY_MULTIPLY)
      }
    } while (attempt < CHUNK_MAX_RETRY)
    return Promise.reject('Unable to upload chunk, max tries exceeded')
  }

  function speedCheck() {
    function speedCheckRun() {
      speedStack = speedStack.slice(-15)
      if (speedStack.length > 0) {
        const avgSpeed = Math.ceil(speedStack.reduce((sum, current) => sum + current) / speedStack.length)
        const remainingBytes = Math.ceil(fileSize.value * ((100 - progress.value) / 100))

        if (!isUndefined(uploadCallback)) {
          uploadCallback(progress.value, avgSpeed, Math.ceil(remainingBytes / avgSpeed))
        }
      }

      if (endTimestamp === 0) {
        speedCheckTimerId = setTimeout(function () {
          speedCheckRun()
        }, SPEED_CHECK_INTERVAL)
      }
    }

    speedCheckRun()
  }

  const stopSpeedCheck = () => {
    endTimestamp = getCurrentTimestamp()
    if (speedCheckTimerId !== undefined) {
      clearTimeout(speedCheckTimerId)
      speedCheckTimerId = undefined
    }
  }

  const uploadInit = async () => {
    return new Promise((resolve, reject) => {
      if (!queueItem.file) {
        failUpload(queueItem)
        return
      }
      fileSize.value = queueItem.file ? queueItem.file.size : 0
      queueItem.status = UploadQueueItemStatus.Uploading
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

    const filesize = queueItem.file?.size
    if (isUndefined(filesize)) return Promise.reject()

    // Stops the speed-check chain on every exit; endTimestamp was set only on success, so a
    // failed upload left the 1s timer rescheduling forever and holding the closure.
    try {
      let i = 0
      while (i < filesize) {
        if (stopped) return Promise.reject(UPLOAD_STOPPED)
        const uploadedChunk = await processAndUploadChunk(i)
        i += uploadedChunk.size
        progress.value = (i / filesize) * 100
      }

      return await finishUpload(queueItem, sha.digest('hex'))
    } finally {
      stopSpeedCheck()
    }
  }

  const stop = () => {
    stopped = true
    stopSpeedCheck()
    queueItem.latestChunkCancelToken?.cancel('axios request cancelled')
  }

  return {
    uploadInit,
    upload,
    stop,
  }
}

export const uploadStop = (cancelTokenSource: CancelTokenSource) => {
  cancelTokenSource.cancel('axios request cancelled')
}
