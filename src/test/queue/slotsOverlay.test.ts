import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, queueRow, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamRequest } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The floating panel of the uploads into the slots of an asset: its title and counter, the list of the uploads,
 * and the two ways to be rid of them - "clear" once they are all settled, and the close button, which asks first
 * while one is still under way. The real panel, list and rows over the real store; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SLOTS = 'slots'
const CLEAR = 'Clear'
const CLOSE = 'Close'
const QUESTION = 'Are you sure you want to stop the upload?'

const slotUpload = (status: UploadQueueItem['status'], over: Partial<UploadQueueItem> = {}) =>
  queueRow({ type: 'slotFile', status, slotName: 'extra', fileId: 'file-2', displayTitle: 'photo.jpg', ...over })

const shown = (button: HTMLElement | null | undefined) => !!button && button.style.display !== 'none'

/** Mounts the panel over the slots queue holding the rows, and over whatever the other queues hold. */
const mountPanel = async (rows: UploadQueueItem[], others: Record<string, UploadQueueItem[]> = {}) => {
  const ui = await startUploadUi({ server, queues: { [SLOTS]: rows, ...others } })
  const { useAssetFooterUploadSlotsView } = await import('@/domains/coreDam/asset/composables/assetFooterUploadSlots')
  const view = useAssetFooterUploadSlotsView()
  const panel = await ui.mount(
    () => import('@/domains/coreDam/asset/components/footer/AssetFooterUploadSlotsOverlay.vue')
  )

  return {
    ...ui,
    rows: ui.rows[SLOTS],
    panel,
    view,
    text: () => panel.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    listed: () => Array.from(panel.querySelectorAll('.dam-upload-queue__item')).map((row) => row.textContent?.trim()),
    held: () => ui.store.getQueueItems(SLOTS).length,
    clear: () => buttonsNamed(panel, CLEAR)[0],
    close: () => buttonsNamed(panel, CLOSE)[0],
  }
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the panel of the slot uploads', () => {
  it('says the upload runs and which of how many it is on, while one is unfinished', async () => {
    const { text } = await mountPanel([
      slotUpload('uploaded'),
      slotUpload('processing', { slotName: 'bonus' }),
      slotUpload('waiting', { slotName: 'free' }),
    ])

    expect(text()).toContain('Upload')
    expect(text()).not.toContain('Upload done')
    expect(text()).toContain('2/3')
  })

  it('says the upload is done, with no counter, once every upload is uploaded or failed', async () => {
    const { text } = await mountPanel([
      slotUpload('uploaded'),
      slotUpload('failed', { error: { hasError: true, message: '', assetFileFailReason: 'unknown' } }),
    ])

    expect(text()).toContain('Upload done')
    expect(text()).not.toMatch(/\d\/\d/)
  })

  it('lists the uploads of the slots queue, and none of another queue', async () => {
    const { listed } = await mountPanel(
      [slotUpload('processing', { displayTitle: 'first.jpg' }), slotUpload('uploaded', { displayTitle: 'second.jpg' })],
      { global: [queueRow({ status: 'processing', displayTitle: 'a new asset.jpg', assetId: 'asset-9' })] }
    )

    expect(listed()).toEqual(['first.jpg', 'second.jpg'])
  })

  it('comes up, small, when the first upload into a slot is queued, and stays as the user has it after that', async () => {
    server.on('POST', /./, () => new Promise(() => undefined))
    stubFileReader()
    const { view, store } = await mountPanel([])
    expect(view.footerViewUploadSlots.value).toBe('hidden')

    await store.addByFilesAsSlotUpload(SLOTS, [new File(['abc'], 'photo.jpg')], 'asset-1', 'extra', 'image')
    await nextTick()
    expect(view.footerViewUploadSlots.value).toBe('compact')

    view.setMinimalUpload()
    await store.addByFilesAsSlotUpload(SLOTS, [new File(['abc'], 'other.jpg')], 'asset-1', 'bonus', 'image')
    await nextTick()
    expect(view.footerViewUploadSlots.value).toBe('minimal')
  })
})

describe('the "clear" button of the panel', () => {
  it('is hidden while an upload is unfinished, and shown once they are all settled', async () => {
    const { clear, rows, store } = await mountPanel([
      slotUpload('uploaded'),
      slotUpload('processing', { slotName: 'bonus' }),
    ])
    expect(shown(clear())).toBe(false)

    rows[1].status = 'uploaded'
    store.recalculateQueueCounts(SLOTS)
    await nextTick()

    expect(shown(clear())).toBe(true)
  })

  it('empties the slots queue and hides the panel, with no question asked and nothing sent', async () => {
    const { clear, held, view, store } = await mountPanel([slotUpload('uploaded')], {
      global: [queueRow({ status: 'uploaded', assetId: 'asset-9' })],
    })
    view.setCompactUpload()

    clear().click()
    await nextTick()

    expect([held(), view.footerViewUploadSlots.value]).toEqual([0, 'hidden'])
    expect(dialogButton(CLOSE)).toBeNull()
    // The other queues are not its business.
    expect(store.getQueueItems('global')).toHaveLength(1)
    expect(server.requests).toEqual([])
  })
})

describe('the close button of the panel', () => {
  it('empties the slots queue and hides the panel at once when no upload is under way', async () => {
    const { close, held, view } = await mountPanel([slotUpload('uploaded')])
    view.setCompactUpload()

    close().click()
    await nextTick()

    expect([held(), view.footerViewUploadSlots.value]).toEqual([0, 'hidden'])
    expect(dialogButton(CLOSE)).toBeNull()
  })

  it('asks first while an upload is under way, and stops the uploads into the slots when the answer is yes', async () => {
    stubFileReader()
    const chunks: FakeDamRequest[] = []
    server.on('POST', /\/chunk$/, (request) => {
      chunks.push(request)

      return new Promise(() => undefined)
    })
    const { close, held, view, store, rows } = await mountPanel(
      [
        slotUpload('waiting', {
          fileId: null,
          file: new File([new Uint8Array(2000)], 'photo.jpg', { type: 'image/jpeg' }),
        }),
      ],
      { global: [queueRow({ status: 'processing', assetId: 'asset-9' })] }
    )
    view.setCompactUpload()
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)
    expect([rows[0].status, chunks.length]).toEqual(['uploading', 1])

    close().click()
    await nextTick()

    expect(document.body.querySelector('.v-dialog')?.textContent).toContain(QUESTION)
    expect([held(), view.footerViewUploadSlots.value, chunks[0].config.signal?.aborted]).toEqual([1, 'compact', false])

    dialogButton(CLOSE)?.click()
    await vi.advanceTimersByTimeAsync(0)

    expect([held(), view.footerViewUploadSlots.value, chunks[0].config.signal?.aborted]).toEqual([0, 'hidden', true])
    expect(rows[0].status).toBe('stop')
    // The upload of a new asset in the other queue goes on.
    expect(store.getQueueItems('global').map((row) => row.status)).toEqual(['processing'])
    expect(server.sent('PATCH')).toEqual([])
  })

  it('leaves the uploads and the panel as they are when the answer is no', async () => {
    const { close, held, view } = await mountPanel([slotUpload('processing')])
    view.setCompactUpload()

    close().click()
    await nextTick()
    dialogButton('Cancel')?.click()
    await eventually(() => expect(dialogButton('Cancel')).toBeNull())

    expect([held(), view.footerViewUploadSlots.value]).toEqual([1, 'compact'])
  })
})
