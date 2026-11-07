import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamRequest } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'
const REFRESH = 'Refresh'
const CANCEL = 'Cancel'
const DELETE = 'Delete'
const EDIT = 'Edit more'

const failed = (): UploadQueueItem['error'] => ({ hasError: true, message: '', assetFileFailReason: 'unknown' })
const warned = (): UploadQueueItem['error'] => ({ hasError: true, message: 'warned', assetFileFailReason: 'none' })
const editable = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, ...over })

const mountQueue = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}) => {
  const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, ...setup })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
    queueId: QUEUE,
    massOperations: true,
  })
  const cards = () => Array.from(list.querySelectorAll<HTMLElement>('.dam-upload-queue__item'))
  const button = (index: number, name: string) => buttonsNamed(cards()[index], name)[0] ?? null
  const press = async (index: number, name: string) => {
    const found = button(index, name)
    if (!found) throw new Error(`row ${index} has no "${name}" button`)
    found.click()
    await nextTick()
  }
  const held = () => ui.store.getQueueItems(QUEUE).map((row) => row.displayTitle)

  return { ...ui, rows: ui.rows[QUEUE], list, cards, button, press, held }
}

const sentTo = (requests: FakeDamRequest[]) => requests.map((request) => request.method + ' ' + request.url)

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the cancel button of a row', () => {
  it('takes its own row out of the queue, whatever its place, and asks the server nothing', async () => {
    const { press, cards, held, rows } = await mountQueue([
      queueRow({ status: 'processing', displayTitle: 'first.jpg' }),
      queueRow({ status: 'processing', displayTitle: 'second.jpg', assetId: 'asset-2', fileId: 'file-2' }),
      queueRow({ status: 'failed', displayTitle: 'third.jpg', assetId: 'asset-3', fileId: 'file-3', error: failed() }),
    ])

    await press(1, CANCEL)
    await eventually(() => expect(cards()).toHaveLength(2))

    expect(held()).toEqual(['first.jpg', 'third.jpg'])
    expect(rows[1].status).toBe('stop')

    // A failed row is taken out the same way. An asset its upload may have made is left as it is.
    await press(1, CANCEL)
    await eventually(() => expect(cards()).toHaveLength(1))

    expect(held()).toEqual(['first.jpg'])
    expect(server.requests).toEqual([])
  })

  it('stops the upload of its row: the chunk on the wire is aborted and the file that waited is sent', async () => {
    stubFileReader()
    const chunks: FakeDamRequest[] = []
    server.on('POST', /\/chunk$/, (request) => {
      chunks.push(request)

      return new Promise(() => undefined)
    })
    const upload = (name: string) =>
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        displayTitle: name,
        file: new File([new Uint8Array(2000)], name, { type: 'image/jpeg' }),
      })
    const { press, store, rows, held } = await mountQueue([
      upload('first.jpg'),
      upload('second.jpg'),
      upload('third.jpg'),
    ])
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    expect(rows.map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])

    await press(0, CANCEL)
    await vi.advanceTimersByTimeAsync(0)

    expect(held()).toEqual(['second.jpg', 'third.jpg'])
    expect(chunks.map((chunk) => chunk.config.signal?.aborted)).toEqual([true, false, false])
    expect(rows.map((row) => row.status)).toEqual(['stop', 'uploading', 'uploading'])
    expect(server.sent('PATCH')).toEqual([])
    expect(server.sent('DELETE')).toEqual([])
  })
})

describe('the refresh button of a row', () => {
  it('asks the server about the asset of its row, and the row is settled by the answer', async () => {
    const { press, rows, alerts } = await mountQueue([
      queueRow({ status: 'uploaded', error: warned() }),
      queueRow({ status: 'uploaded', error: warned(), assetId: 'asset-2', fileId: 'file-2' }),
    ])
    server.asset(assetDetail('asset-2', { mainFile: assetFile('file-2', 'processed', { asset: 'asset-2' }) }))

    await press(1, REFRESH)
    await eventually(() => expect(rows[1].canEditMetadata).toBe(true))

    expect(sentTo(server.sent('GET', /\/asset\//))).toEqual(['GET /adm/v1/asset/asset-2'])
    expect(rows[1].customData).toEqual({ title: 'from the server' })
    expect([rows[0].canEditMetadata, rows[0].customData]).toEqual([false, {}])
    expect(alerts()).toEqual([])
  })

  it('cannot be pressed on any row while the answer for one is on its way', async () => {
    const { press, button, rows } = await mountQueue([
      queueRow({ status: 'uploaded', error: warned() }),
      queueRow({ status: 'uploaded', error: warned(), assetId: 'asset-2', fileId: 'file-2' }),
    ])
    let answer: (asset: unknown) => void = () => undefined
    server.assetBy('asset-1', () => new Promise((resolve) => (answer = resolve)))

    await press(0, REFRESH)

    expect([button(0, REFRESH)?.disabled, button(1, REFRESH)?.disabled]).toEqual([true, true])

    answer(assetDetail('asset-1'))
    await eventually(() => expect(rows[0].canEditMetadata).toBe(true))
    await nextTick()

    expect([button(0, REFRESH), button(1, REFRESH)?.disabled]).toEqual([null, false])
  })

  it('tells the user when the file is still on its way, and leaves the row as it is', async () => {
    const { press, rows, alerts } = await mountQueue([queueRow({ status: 'uploaded', error: warned() })])
    server.asset(
      assetDetail('asset-1', {
        attributes: { assetType: 'image', assetStatus: 'draft' },
        mainFile: assetFile('file-1', 'uploading'),
      })
    )

    await press(0, REFRESH)
    await eventually(() => expect(alerts()).toEqual(['Asset is still uploading or being processed by server']))

    expect([rows[0].status, rows[0].canEditMetadata]).toEqual(['uploaded', false])
  })

  it('tells the user when the state of the row could not be read', async () => {
    const { press, alerts, rows } = await mountQueue([queueRow({ status: 'uploaded', error: warned() })])
    server.assetBy('asset-1', () => {
      throw httpError(503)
    })

    await press(0, REFRESH)
    await eventually(() => expect(alerts()).toEqual(["The item's state could not be loaded. Try again."]))

    expect([rows[0].status, rows[0].canEditMetadata]).toEqual(['uploaded', false])
  })
})

describe('the delete button of a row', () => {
  const question = () => document.body.querySelector<HTMLElement>('.v-dialog')?.textContent?.replace(/\s+/g, ' ').trim()

  it('asks first, and sends nothing until the question is answered', async () => {
    const { press, held } = await mountQueue([editable({ displayTitle: 'photo.jpg' })])

    await press(0, DELETE)

    expect(question()).toContain('Remove?')
    expect(server.requests).toEqual([])

    dialogButton(CANCEL)?.click()
    await eventually(() => expect(dialogButton(DELETE)).toBeNull())

    expect(server.requests).toEqual([])
    expect(held()).toEqual(['photo.jpg'])
  })

  it('deletes the asset of its row on the server, takes the row out of the queue and says so', async () => {
    server.on('DELETE', /^\/adm\/v1\/asset\/([^/]+)$/, () => ({ status: 204 }))
    const { press, held, cards, alerts } = await mountQueue([
      editable({ displayTitle: 'first.jpg' }),
      editable({ displayTitle: 'second.jpg', assetId: 'asset-2', fileId: 'file-2' }),
    ])

    await press(1, DELETE)
    dialogButton(DELETE)?.click()
    await eventually(() => expect(cards()).toHaveLength(1))

    expect(sentTo(server.sent('DELETE'))).toEqual(['DELETE /adm/v1/asset/asset-2'])
    expect(held()).toEqual(['first.jpg'])
    await eventually(() => expect(alerts()).toEqual(['Record was removed']))
  })

  // The delete is awaited, and the position of the row can change meanwhile.
  it('takes out the row of the deleted asset, not whatever row has moved to its place meanwhile', async () => {
    let deleted: () => void = () => undefined
    server.on('DELETE', /^\/adm\/v1\/asset\/([^/]+)$/, async () => {
      await new Promise<void>((resolve) => (deleted = resolve))

      return { status: 204 }
    })
    const { press, held, cards } = await mountQueue([
      queueRow({ status: 'processing', displayTitle: 'first.jpg' }),
      editable({ displayTitle: 'second.jpg', assetId: 'asset-2', fileId: 'file-2' }),
      editable({ displayTitle: 'third.jpg', assetId: 'asset-3', fileId: 'file-3' }),
    ])

    await press(1, DELETE)
    dialogButton(DELETE)?.click()
    await eventually(() => expect(server.sent('DELETE')).toHaveLength(1))
    await press(0, CANCEL)
    await eventually(() => expect(cards()).toHaveLength(2))
    deleted()
    await eventually(() => expect(cards()).toHaveLength(1))

    expect(held()).toEqual(['third.jpg'])
  })

  it('takes out no other row when its own has left the queue before the delete was answered', async () => {
    let deleted: () => void = () => undefined
    server.on('DELETE', /^\/adm\/v1\/asset\/([^/]+)$/, async () => {
      await new Promise<void>((resolve) => (deleted = resolve))

      return { status: 204 }
    })
    const { press, held, cards, store } = await mountQueue([
      editable({ displayTitle: 'first.jpg' }),
      editable({ displayTitle: 'second.jpg', assetId: 'asset-2', fileId: 'file-2' }),
      editable({ displayTitle: 'third.jpg', assetId: 'asset-3', fileId: 'file-3' }),
    ])

    await press(1, DELETE)
    dialogButton(DELETE)?.click()
    await eventually(() => expect(server.sent('DELETE')).toHaveLength(1))
    await store.removeByIndex(QUEUE, 1)
    await eventually(() => expect(cards()).toHaveLength(2))
    deleted()
    await vi.advanceTimersByTimeAsync(100)

    expect(held()).toEqual(['first.jpg', 'third.jpg'])
  })

  // Rows can share an asset. When the asset is gone, every row of it goes, not only the first.
  it('takes out its own row and every other row of its asset, where two rows are of one asset', async () => {
    server.on('DELETE', /^\/adm\/v1\/asset\/([^/]+)$/, () => ({ status: 204 }))
    const { press, held, cards } = await mountQueue([
      editable({ displayTitle: 'first.jpg' }),
      editable({ displayTitle: 'second.jpg' }),
      editable({ displayTitle: 'third.jpg', assetId: 'asset-2', fileId: 'file-2' }),
    ])

    await press(1, DELETE)
    dialogButton(DELETE)?.click()
    await eventually(() => expect(cards()).toHaveLength(1))

    expect(sentTo(server.sent('DELETE'))).toEqual(['DELETE /adm/v1/asset/asset-1'])
    expect(held()).toEqual(['third.jpg'])
  })

  it('leaves the row in the queue and shows the error when the server refuses', async () => {
    server.on('DELETE', /^\/adm\/v1\/asset\/([^/]+)$/, () => {
      throw httpError(500)
    })
    const { press, held, alerts } = await mountQueue([editable({ displayTitle: 'photo.jpg' })])

    await press(0, DELETE)
    dialogButton(DELETE)?.click()
    await eventually(() => expect(alerts()).toEqual(['System error, try again later or contact administrator']))

    expect(held()).toEqual(['photo.jpg'])
  })

  // The row of a duplicate stays the row of the asset its own upload made. The original is only linked.
  it('deletes the asset the upload of a duplicate made, never the original it is a duplicate of', async () => {
    server.on('DELETE', /^\/adm\/v1\/asset\/([^/]+)$/, () => ({ status: 204 }))
    const { press, cards, rows, button } = await mountQueue([queueRow({ status: 'uploaded', error: warned() })])
    server.asset(
      assetDetail('asset-1', {
        mainFile: assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' }),
      })
    )
    server.file('image', assetFile('file-origin', 'processed', { asset: 'asset-original' }))
    await press(0, REFRESH)
    await eventually(() => expect(rows[0].isDuplicate).toBe(true))
    await nextTick()
    expect([rows[0].assetId, rows[0].duplicateAssetId]).toEqual(['asset-1', 'asset-original'])
    // The library notes the asset made by the upload on every duplicate. The row keeps it as its asset too.
    expect(rows[0].uploadedAssetId).toBe('asset-1')
    expect(button(0, DELETE)?.disabled).toBe(false)

    await press(0, DELETE)
    dialogButton(DELETE)?.click()
    await eventually(() => expect(cards()).toHaveLength(0))

    expect(sentTo(server.sent('DELETE'))).toEqual(['DELETE /adm/v1/asset/asset-1'])
  })
})

describe('the edit button of a row', () => {
  const stores = async () => {
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')

    return { detail: useAssetDetailStore(), assetList: useAssetListStore() }
  }

  it('opens the detail of the asset of its row, read from the server, as a detail opened from the queue', async () => {
    const { press } = await mountQueue([editable(), editable({ assetId: 'asset-2', fileId: 'file-2' })])
    const { detail, assetList } = await stores()
    assetList.keyboardNavigationEnable()
    let answer: (asset: unknown) => void = () => undefined
    server.assetBy('asset-2', () => new Promise((resolve) => (answer = resolve)))

    await press(1, EDIT)

    expect([detail.detail, detail.loader, detail.view, detail.asset]).toEqual([true, true, 'queue', null])
    expect(assetList.keyboardNavigation).toBe(false)

    answer(assetDetail('asset-2'))
    await eventually(() => expect(detail.loader).toBe(false))

    expect(sentTo(server.sent('GET', /\/asset\//))).toEqual(['GET /adm/v1/asset/asset-2'])
    expect([detail.detail, detail.view, detail.asset?.id]).toEqual([true, 'queue', 'asset-2'])
  })

  it('closes the detail again and shows the error when the asset cannot be read', async () => {
    const { press, alerts } = await mountQueue([editable()])
    const { detail, assetList } = await stores()
    server.assetBy('asset-1', () => {
      throw httpError(500)
    })

    await press(0, EDIT)
    await eventually(() => expect(detail.detail).toBe(false))

    expect([detail.loader, detail.view, detail.asset]).toEqual([false, 'list', null])
    expect(assetList.keyboardNavigation).toBe(true)
    await eventually(() => expect(alerts()).toEqual(['System error, try again later or contact administrator']))
  })
})

describe('the editable list of a queue', () => {
  const sidebar = (list: HTMLElement) => list.querySelector('.asset-queue-editable__sidebar')

  it('draws a card for each row of its own queue, in the order of the queue', async () => {
    const ui = await startUploadUi({
      server,
      queues: {
        [QUEUE]: [
          queueRow({ displayTitle: 'first.jpg' }),
          queueRow({ displayTitle: 'second.jpg', assetId: 'asset-2' }),
        ],
        edit: [queueRow({ type: 'asset', status: 'uploaded', displayTitle: 'picked', assetId: 'asset-3' })],
      },
    })
    const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
      queueId: QUEUE,
      massOperations: true,
    })
    const titles = () =>
      Array.from(list.querySelectorAll('.dam-upload-queue__item')).map(
        (card) => card.textContent?.match(/Original Name: (\S+)/)?.[1]
      )

    expect(titles()).toEqual(['first.jpg', 'second.jpg'])

    ui.store.addQueueItem(QUEUE, queueRow({ displayTitle: 'third.jpg', assetId: 'asset-4' }))
    await nextTick()

    expect(titles()).toEqual(['first.jpg', 'second.jpg', 'third.jpg'])
  })

  it('has the mass operations beside the rows only while it holds more than one row', async () => {
    const { list, press, cards } = await mountQueue([
      queueRow({ status: 'processing' }),
      queueRow({ status: 'processing', assetId: 'asset-2', fileId: 'file-2' }),
    ])
    expect(sidebar(list)?.textContent).toContain('Mass operations')

    await press(0, CANCEL)
    await eventually(() => expect(cards()).toHaveLength(1))

    expect(sidebar(list)).toBeNull()
  })

  it('has no mass operations for a single row', async () => {
    const { list } = await mountQueue([queueRow({ status: 'processing' })])

    expect(sidebar(list)).toBeNull()
  })

  // The list of the library scrolls with these keys. In admin-dam they walk the assets behind the overlay.
  it.each(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])('leaves the %s key alone', async (key) => {
    await mountQueue([queueRow({ status: 'processing' })])
    const pressed = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

    document.dispatchEvent(pressed)

    expect(pressed.defaultPrevented).toBe(false)
  })

  it('asks the server once for the names of all the keywords and all the authors its rows hold', async () => {
    const { asked } = await mountQueue([
      editable({ keywords: ['keyword-1', 'keyword-2'], authors: ['author-1'] }),
      editable({ keywords: ['keyword-2', 'keyword-3'], authors: [], assetId: 'asset-2', fileId: 'file-2' }),
    ])

    await vi.advanceTimersByTimeAsync(10_000)

    const ids = (kind: string) =>
      asked
        .filter((url) => url.startsWith(`/adm/v1/${kind}/ext-system/1/search?`))
        .map((url) => new URLSearchParams(url.split('?')[1]).get('id')?.split(',').sort())
    expect(ids('keyword')).toEqual([['keyword-1', 'keyword-2', 'keyword-3']])
    expect(ids('author')).toEqual([['author-1']])
  })
})
