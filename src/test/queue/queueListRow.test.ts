import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'

const mountList = async (rows: UploadQueueItem[]) => {
  const ui = await startUploadUi({ server, queues: { [QUEUE]: rows } })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueUploadList.vue'), {
    queueId: QUEUE,
  })
  const drawn = () => Array.from(list.querySelectorAll<HTMLElement>('.dam-upload-queue__item'))
  const row = (index = 0) => {
    const element = drawn()[index]
    const status = element.querySelector<HTMLElement>('.dam-upload-queue__item-status')!
    const spinner = status.querySelector('.v-progress-circular')

    return {
      text: element.textContent?.replace(/\s+/g, ' ').trim(),
      icon: status.querySelector('.v-icon')?.className.match(/mdi-[a-z-]+/)?.[0],
      iconColor: status.querySelector('.v-icon')?.className.match(/text-(error|warning|success)/)?.[1],
      spinner: spinner
        ? spinner.classList.contains('v-progress-circular--indeterminate')
          ? 'endless'
          : 'measured'
        : 'none',
      hint: status.getAttribute('title'),
      // The row has one button. It has a tooltip and no accessible name.
      cancel: element.querySelector<HTMLButtonElement>('button'),
    }
  }

  return { ...ui, rows: ui.rows[QUEUE], drawn, row }
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the icon of a compact row', () => {
  it.each(['waiting', 'loading', 'uploading', 'processing'] as const)(
    'is a spinner while the row is %s, endless until the upload reports its progress',
    async (status) => {
      const { row, rows } = await mountList([queueRow({ status })])

      expect([row().spinner, row().icon]).toEqual(['endless', undefined])

      rows[0].progress.progressPercent = 40
      await nextTick()

      expect(row().spinner).toBe('measured')
    }
  )

  it('is a green check for a row that is uploaded', async () => {
    const { row } = await mountList([queueRow({ status: 'uploaded' })])

    expect([row().icon, row().iconColor, row().spinner]).toEqual(['mdi-check', 'success', 'none'])
  })

  it('is a yellow warning for a row that is a duplicate', async () => {
    const { row, drawn } = await mountList([queueRow({ status: 'uploaded', isDuplicate: true })])

    expect([row().icon, row().iconColor]).toEqual(['mdi-alert', 'warning'])
    // The end-to-end tests of the application find the icon by this `data-cy`.
    expect(drawn()[0].querySelector('[data-cy="icon-duplicate"]')).not.toBeNull()
  })

  it('is a red warning for a row with an error, in place of the spinner of a row still processing', async () => {
    const { row } = await mountList([
      queueRow({ status: 'failed', error: { hasError: true, message: '', assetFileFailReason: 'unknown' } }),
      queueRow({ status: 'processing', error: { hasError: true, message: 'too long', assetFileFailReason: 'none' } }),
    ])

    expect([row(0).icon, row(0).iconColor, row(0).spinner]).toEqual(['mdi-alert', 'error', 'none'])
    expect([row(1).icon, row(1).iconColor, row(1).spinner]).toEqual(['mdi-alert', 'error', 'none'])
  })
})

describe('what the icon of a compact row says when pointed at', () => {
  const failed = (message: string, assetFileFailReason: string) =>
    queueRow({ status: 'failed', error: { hasError: true, message, assetFileFailReason } as UploadQueueItem['error'] })

  it('is the reason the server gave for the failure', async () => {
    const { row } = await mountList([failed('', 'invalid_checksum')])

    expect(row().hint).toBe('Invalid checksum')
  })

  it('is the message of the row when the server gave no reason', async () => {
    const { row } = await mountList([failed('Incorrect file format', 'none')])

    expect(row().hint).toBe('Incorrect file format')
  })

  it('is the reason and not the message when the row has both', async () => {
    const { row } = await mountList([failed('Incorrect file format', 'invalid_size')])

    expect(row().hint).toBe('Invalid size')
  })

  // Current behavior: the reason is looked up first.
  // A reason the application has no text for hides the message too.
  it('is nothing for a reason the application has no text for, although the row has a message', async () => {
    const { row } = await mountList([failed('Incorrect file format', 'quota_exceeded')])

    expect(row().hint).toBe('')
  })

  it('is nothing for a row without an error', async () => {
    const { row } = await mountList([queueRow({ status: 'uploaded' })])

    expect(row().hint).toBe('')
  })
})

describe('the cancel button of a compact row', () => {
  it.each(['loading', 'waiting', 'uploading', 'processing', 'failed'] as const)(
    'is there for a row that is %s',
    async (status) => {
      const { row } = await mountList([queueRow({ status })])

      expect(row().cancel).not.toBeNull()
    }
  )

  it.each(['uploaded', 'stop'] as const)('is not there for a row that is %s', async (status) => {
    const { row } = await mountList([queueRow({ status })])

    expect(row().cancel).toBeNull()
  })

  it('takes its own row out of the queue, whatever its place, and leaves the others', async () => {
    const { row, rows, store, drawn } = await mountList([
      queueRow({ status: 'processing', displayTitle: 'first.jpg' }),
      queueRow({ status: 'processing', displayTitle: 'second.jpg', assetId: 'asset-2', fileId: 'file-2' }),
      queueRow({ status: 'failed', displayTitle: 'third.jpg', assetId: 'asset-3', fileId: 'file-3' }),
    ])

    row(1).cancel?.click()
    await eventually(() => expect(drawn()).toHaveLength(2))

    expect(store.getQueueItems(QUEUE).map((item) => item.displayTitle)).toEqual(['first.jpg', 'third.jpg'])
    expect(rows[1].status).toBe('stop')
    expect([row(0).text, row(1).text]).toEqual(['first.jpg', 'third.jpg'])
    expect(server.requests).toEqual([])
  })
})

describe('the line of a compact row', () => {
  it('is the name of the file, or a text that says it has none', async () => {
    const { row } = await mountList([
      queueRow({ status: 'uploaded', displayTitle: 'photo.jpg' }),
      queueRow({ status: 'uploaded', displayTitle: '' }),
    ])

    expect([row(0).text, row(1).text]).toEqual(['photo.jpg', 'no title'])
  })

  it('ends with the time the upload still needs, while there is some', async () => {
    const { row, rows } = await mountList([
      queueRow({
        status: 'uploading',
        displayTitle: 'photo.jpg',
        progress: { remainingTime: 42, progressPercent: 10, speed: 100 },
      }),
    ])

    expect(row().text).toBe('photo.jpg 42 s')

    rows[0].progress.remainingTime = 0
    await nextTick()

    expect(row().text).toBe('photo.jpg')
  })
})
