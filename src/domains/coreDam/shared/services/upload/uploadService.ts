import {
  adminDamUploadPreset,
  axiosErrorResponseHasForbiddenOperationData,
  axiosErrorResponseHasValidationData,
  uploadStop,
  uploadValidationMessage,
  useDamUpload,
} from '@anzusystems/common-admin'
import type { UploadMessages, UploadProgressCallback, UploadQueueItem } from '@anzusystems/common-admin'
import { isAxiosError } from 'axios'
import rusha from 'rusha'

import { uploadChunk, uploadFinish, uploadStart } from '@/domains/coreDam/asset/api/fileApi'
import { i18n } from '@/plugins/i18n'
import { envConfig } from '@/shared/EnvConfigService'

const messages: UploadMessages = {
  unknownError: () => i18n.global.t('system.uploadErrors.unknownError'),
  size: () => i18n.global.t('system.uploadErrors.size'),
  offset: () => i18n.global.t('system.uploadErrors.offset'),
  mimeType: () => i18n.global.t('system.uploadErrors.mimeType'),
  systemError: () => i18n.global.t('system.uploadErrors.systemError'),
  // The store writes its own text over it, as it does today: the text a user sees does not change.
  chunkValidationFailed: () => i18n.global.t('system.uploadErrors.unknownError'),
}

const handleForbiddenOperationMessage = (error: Error) => {
  const { t, te } = i18n.global
  const detail = isAxiosError(error) ? (error.response?.data as { detail?: string })?.detail : undefined
  const key = 'error.apiForbiddenOperation.' + detail

  return detail && te(key) ? t(key) : t('error.apiForbiddenOperation.noTranslation')
}

// A rejected upload carries its reason in the response; without this the row is only a red icon.
export const resolveUploadErrorMessage = (error: unknown) => {
  if (axiosErrorResponseHasForbiddenOperationData(error as Error)) {
    return handleForbiddenOperationMessage(error as Error)
  }
  if (axiosErrorResponseHasValidationData(error as Error)) {
    return uploadValidationMessage(error, messages)
  }

  return messages.unknownError()
}

/* The run of the library with admin-dam's set: its requests for the four asset types, its texts, its timeout and
 * its own `rusha`. Made for each run, so the timeout is the one the configuration holds by then. */
export const useUpload = (queueItem: UploadQueueItem, uploadCallback?: UploadProgressCallback) =>
  useDamUpload(
    queueItem,
    uploadCallback,
    adminDamUploadPreset({
      requests: { start: uploadStart, chunk: uploadChunk, finish: uploadFinish },
      messages,
      apiTimeout: envConfig.dam.apiTimeout,
      // Already settled: no wait on the way of an upload (the hash is ready before the start goes out).
      loadHash: () => Promise.resolve(rusha.createHash()),
    })
  )

export { uploadStop }
