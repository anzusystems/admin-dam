import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The browser reports a pick of the file input only when the pick changes what the input holds.
 * Picking the same file again into an input that still holds it reported nothing, and no upload started.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

const openUpload = async (variant: 'button' | 'slot-upload') => {
  const ui = await startUploadUi({ server })
  const handed: string[][] = []
  const upload = await ui.mount(() => import('@/domains/coreDam/shared/components/FileUpload.vue'), {
    fileInputKey: 0,
    variant,
    buttonText: 'Upload',
    onFilesInput: (files: File[]) => handed.push(files.map((file) => file.name)),
  })
  const input = upload.querySelector<HTMLInputElement>('input[type="file"]')!
  // What the input holds, as the browser keeps it. Assigning '' empties it, the only value a page may set.
  let holds = ''
  Object.defineProperty(input, 'value', {
    configurable: true,
    get: () => holds,
    set: (value: string) => {
      holds = value
    },
  })

  return {
    handed,
    holds: () => holds,
    // Each pick is a new file object, as in the browser.
    pick: async (name: string) => {
      const path = 'C:\\fakepath\\' + name
      if (holds === path) return
      holds = path
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: [new File(['content'], name, { type: 'image/png' })],
      })
      input.dispatchEvent(new Event('change'))
      await nextTick()
    },
  }
}

describe('the upload button and the slot upload button', () => {
  it.each(['button', 'slot-upload'] as const)('hand over the same file picked again (%s)', async (variant) => {
    const upload = await openUpload(variant)

    await upload.pick('same.png')
    await upload.pick('same.png')
    await upload.pick('other.png')
    await upload.pick('other.png')

    expect([upload.handed, upload.holds()]).toEqual([[['same.png'], ['same.png'], ['other.png'], ['other.png']], ''])
  })
})
