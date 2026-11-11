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
  // The store overwrites this with its own text, so the user-visible message is unchanged.
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

/* Created per run so the timeout reflects the current configuration. */
export const useUpload = (queueItem: UploadQueueItem, uploadCallback?: UploadProgressCallback) =>
  useDamUpload(
    queueItem,
    uploadCallback,
    adminDamUploadPreset({
      requests: { start: uploadStart, chunk: uploadChunk, finish: uploadFinish },
      messages,
      apiTimeout: envConfig.dam.apiTimeout,
      // Already resolved: the hash is ready before the upload start is sent, so there is no wait.
      loadHash: () => Promise.resolve(rusha.createHash()),
    })
  )

export { uploadStop }
