import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The chip that says why the server failed a file: one text for each reason the server knows, in both languages of
 * the application. A row of the editable queue shows it over its picture, the slot of an asset and the info box of
 * the detail beside the file. The chip of the library, with the messages of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

// Every reason core-dam can give a failed file, `none` among them.
const reasons: Array<[string, string, string]> = [
  ['none', 'None', 'Žiadny'],
  ['unknown', 'Unknown', 'Neznámy'],
  ['invalid_checksum', 'Invalid checksum', 'Neplatný kontrolný súčet'],
  ['invalid_mime_type', 'Invalid file type', 'Neplatný typ súboru'],
  ['download_failed', 'Download failed', 'Sťahovanie zlyhalo'],
  ['invalid_size', 'Invalid size', 'Neplatná veľkosť'],
]

const mountChip = async (reason: string, locale: 'en' | 'sk' = 'en') => {
  const ui = await startUploadUi({ server })
  if (locale === 'sk') {
    const { i18n } = await import('@/plugins/i18n')
    i18n.global.setLocaleMessage('sk', (await import('@/locales/sk')).default)
    i18n.global.locale.value = 'sk'
  }
  const page = await ui.mount(async () => ({ default: ui.library.ADamAssetFileFailReasonChip }), { reason })

  return { ...ui, chip: () => page.querySelector('.v-chip') }
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the chip of the reason a file failed for', () => {
  it.each(reasons)('says "%s" in English: %s', async (reason, english) => {
    const { chip } = await mountChip(reason)

    expect(chip()?.textContent?.trim()).toBe(english)
  })

  it.each(reasons)('says "%s" in Slovak: %s, %s', async (reason, _english, slovak) => {
    const { chip } = await mountChip(reason, 'sk')

    expect(chip()?.textContent?.trim()).toBe(slovak)
  })

  it('has a text for every reason the library knows of', async () => {
    const { library } = await mountChip('unknown')

    expect(Object.values(library.AssetFileFailReason).sort()).toEqual(reasons.map(([reason]) => reason).sort())
  })

  // As it is today: a reason the application was not told of leaves nothing on the page.
  it('is not drawn at all for a reason it has no text for', async () => {
    const { chip } = await mountChip('quota_exceeded')

    expect(chip()).toBeNull()
  })
})

describe('a failed row of the editable queue whose reason has no text', () => {
  // As it is today: the row says "Error" and nothing else, neither the chip nor the text of an unknown error.
  it('says that there is an error, and not which', async () => {
    const ui = await startUploadUi({
      server,
      queues: {
        global: [
          queueRow({
            status: 'failed',
            error: { hasError: true, message: '', assetFileFailReason: 'quota_exceeded' as never },
          }),
        ],
      },
    })
    const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
      queueId: 'global',
      massOperations: false,
    })
    await nextTick()

    const overlay = list.querySelector('.dam-upload-queue__overlay--error')
    expect(overlay?.textContent?.trim()).toBe('Error')
    expect(overlay?.querySelector('.v-chip')).toBeNull()
  })
})
