import { describe, expect, it, vi } from 'vitest'

import { forbiddenOperationError, httpError, validationError } from '@/test/support/fakeDam'

/* The text a failed upload leaves on its row and shows in its alert. No catalogue is loaded here, so a text is
 * the key it is looked up under - but for the one forbidden operation the case below gives a text of its own. */

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))

const load = async () => {
  vi.resetModules()
  const { i18n } = await import('@/plugins/i18n')
  i18n.global.mergeLocaleMessage('sk', {
    error: { apiForbiddenOperation: { licence_manual_upload_disabled: 'This licence takes no manual uploads.' } },
  } as never)

  return (await import('@/domains/coreDam/shared/services/upload/uploadService')).resolveUploadErrorMessage
}

describe('the message of a failed upload', () => {
  it('is the text of the operation the server refused, where there is one', async () => {
    const message = await load()

    expect(message(forbiddenOperationError('licence_manual_upload_disabled'))).toBe(
      'This licence takes no manual uploads.'
    )
  })

  it('is a general text for a refused operation that has none', async () => {
    const message = await load()

    expect(message(forbiddenOperationError('something_new'))).toBe('error.apiForbiddenOperation.noTranslation')
  })

  it('names each field the server found wrong, one to a line', async () => {
    const message = await load()

    expect(message(validationError({ size: ['error_field_invalid'] }))).toBe('system.uploadErrors.size')
    expect(
      message(
        validationError({
          size: ['error_field_invalid'],
          offset: ['error_field_invalid'],
          mimeType: ['error_field_invalid'],
          checksum: ['error_field_empty', 'error_field_invalid'],
        })
      )
    ).toBe(
      [
        'system.uploadErrors.size',
        'system.uploadErrors.offset',
        'system.uploadErrors.mimeType',
        // A field the upload has no text for is named as the server names it, with what was wrong with it.
        'system.uploadErrors.systemError: checksum - error_field_empty,error_field_invalid',
      ].join('\n')
    )
  })

  it('is the unknown-error text for a validation answer that names no field', async () => {
    const message = await load()

    expect(message(validationError({}))).toBe('system.uploadErrors.unknownError')
  })

  it.each([
    ['a server error', httpError(500, { error: 'internal' })],
    ['a 422 of another kind', httpError(422, { error: 'something_else' })],
    ['a request that never got an answer', new Error('Network Error')],
    ['a rejection with no reason', undefined],
    ['a rejection with a bare text', 'Unable to upload chunk, max tries exceeded'],
  ])('is the unknown-error text for anything else: %s', async (_name, error) => {
    const message = await load()

    expect(message(error)).toBe('system.uploadErrors.unknownError')
  })
})
