import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  assetDetail,
  createFakeDam,
  httpError,
  queueRow,
  stubFileReader,
  validationError,
} from '@/test/support/fakeDam'
import type { FakeDam, FakeDamRequest } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  setWindowWidth,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/* The two full-screen overlays that edit and save a whole queue: the one of the uploads and the one of the assets
 * picked for mass edit. Each is mounted whole - toolbar, editable list, rows and forms - over the real stores, with
 * the application around it as it starts; the server is a fake.
 *
 * That neither can be saved while no row would be sent is in `saveNothing.test.ts`; what the rows validate is in
 * `queueRowValidation.test.ts` and `asset/assetMetadataValidation.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SAVE_AND_FINISH = 'Save and finish'
const FIX_FIRST = 'Please fill all required fields and fix problems'
const UPDATED = 'Record was updated'
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const LIST = /^\/adm\/v1\/asset\/licence\/1\/search$/

const editable = (assetId: string, over: Partial<UploadQueueItem> = {}) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, assetId, fileId: 'file-of-' + assetId, ...over })

const iconButton = (within: ParentNode, icon: string) =>
  within.querySelector('.' + icon)?.closest<HTMLButtonElement>('button') ?? null

const texts = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? ''

const sentTo = (requests: FakeDamRequest[]) => requests.map((request) => request.method + ' ' + request.url)
const saved = () => server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))

const requiredTitle = { customForm: { image: [customField('title', { required: true })] } }

// What the server can do to the save in place of answering it with a 200.
const refusals: Array<[string, () => { status: number }]> = [
  [
    'a server error',
    () => {
      throw httpError(500)
    },
  ],
  [
    'a validation error',
    () => {
      throw validationError({ 'customData.title': ['error_field_empty'] })
    },
  ],
  ['an answer other than 200', () => ({ status: 204 })],
]

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('GET', LIST, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the overlay of the uploads', () => {
  const QUEUE = 'global'

  /** Mounts the overlay, opened full as the user opens it, over the upload queue holding the rows. */
  const mountOverlay = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}) => {
    const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, ...setup })
    const { useAssetFooterUploadView } = await import('@/domains/coreDam/asset/composables/assetFooterUpload')
    const view = useAssetFooterUploadView()
    view.setFullUpload()
    const overlay = await ui.mount(
      () => import('@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue')
    )
    const toolbar = overlay.querySelector<HTMLElement>('.v-toolbar')!

    return {
      ...ui,
      rows: ui.rows[QUEUE],
      overlay,
      toolbar,
      shown: () => view.footerViewUpload.value,
      held: () => ui.store.getQueueItems(QUEUE).length,
      saveAndFinish: () => buttonsNamed(toolbar, SAVE_AND_FINISH)[0] ?? null,
      save: () => iconButton(toolbar, 'mdi-content-save')!,
      close: () => buttonsNamed(toolbar, 'Close')[0],
    }
  }

  describe('its toolbar', () => {
    it('says the upload runs and which file of how many it is on, and offers no "save and finish"', async () => {
      const { toolbar, saveAndFinish } = await mountOverlay([
        editable('asset-1'),
        queueRow({
          status: 'failed',
          assetId: 'asset-2',
          error: { hasError: true, message: '', assetFileFailReason: 'unknown' },
        }),
        queueRow({ status: 'processing', assetId: 'asset-3' }),
        queueRow({ status: 'waiting', assetId: null, fileId: null }),
      ])

      // Two of the four are settled, one way or the other.
      expect(texts(toolbar)).toContain('Upload')
      expect(texts(toolbar)).not.toContain('Upload done')
      expect(texts(toolbar)).toContain('Uploading 3/4')
      expect(saveAndFinish()).toBeNull()
    })

    it('says the upload is done once every row is settled, and offers "save and finish" from then on', async () => {
      const { toolbar, saveAndFinish, rows, store } = await mountOverlay([
        editable('asset-1'),
        queueRow({ status: 'processing', assetId: 'asset-2' }),
      ])
      expect(saveAndFinish()).toBeNull()

      rows[1].status = 'uploaded'
      store.recalculateQueueCounts(QUEUE)
      await nextTick()

      expect(texts(toolbar)).toContain('Upload done')
      expect(texts(toolbar)).not.toContain('Uploading')
      expect(saveAndFinish()).not.toBeNull()
    })

    it.each([
      ['a wide window', 1920, false],
      ['a narrow window', 800, true],
    ])(
      'has the mass operations open or folded by the width of the window, and their button turns that: %s',
      async (_name, width, foldedAtFirst) => {
        setWindowWidth(width)
        const { toolbar, overlay } = await mountOverlay([editable('asset-1'), editable('asset-2')])
        const folded = () => !overlay.querySelector('.asset-queue-editable--sidebar-active')
        expect(folded()).toBe(foldedAtFirst)

        iconButton(toolbar, 'mdi-tag-text-outline')?.click()
        await nextTick()
        expect(folded()).toBe(!foldedAtFirst)

        iconButton(toolbar, 'mdi-tag-text-outline')?.click()
        await nextTick()
        expect(folded()).toBe(foldedAtFirst)
      }
    )

    it('folds the overlay down to its smallest with the hide button, and keeps the queue', async () => {
      const { toolbar, shown, held } = await mountOverlay([editable('asset-1')])

      iconButton(toolbar, 'mdi-chevron-down')?.click()
      await nextTick()

      expect([shown(), held()]).toEqual(['minimal', 1])
    })
  })

  describe('its save button', () => {
    it('sends the metadata of the rows that can be edited, reads the asset list again and says so', async () => {
      const { save, alerts, held, shown } = await mountOverlay([
        editable('asset-1', {
          keywords: ['keyword-1'],
          authors: ['author-1'],
          customData: { title: 'typed' },
          mainFileSingleUse: true,
        }),
        // Not sent: a failed upload, a duplicate, a row still waiting for its metadata.
        queueRow({
          status: 'failed',
          assetId: 'asset-2',
          error: { hasError: true, message: 'x', assetFileFailReason: 'none' },
        }),
        queueRow({ status: 'uploaded', assetId: 'asset-3', isDuplicate: true }),
        queueRow({ status: 'uploaded', assetId: 'asset-4' }),
        editable('asset-5'),
      ])

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved()).toEqual([
        [
          {
            id: 'asset-1',
            keywords: ['keyword-1'],
            authors: ['author-1'],
            described: true,
            customData: { title: 'typed' },
            mainFileSingleUse: true,
          },
          { id: 'asset-5', keywords: [], authors: [], described: true, customData: {} },
        ],
      ])
      expect(sentTo(server.sent('GET', LIST))).toEqual(['GET /adm/v1/asset/licence/1/search'])
      // The save is not the end of the work: the queue and the overlay stay.
      expect([held(), shown()]).toEqual([5, 'full'])
    })

    it('sends nothing, and says what to do, while a row that would be saved has a required field empty', async () => {
      const { save, alerts, overlay } = await mountOverlay(
        [editable('asset-1', { customData: { title: 'filled' } }), editable('asset-2')],
        requiredTitle
      )

      save().click()
      await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))

      expect(server.sent('PATCH')).toEqual([])
      expect(server.sent('GET', LIST)).toEqual([])
      // And the field says so itself.
      expect(overlay.querySelectorAll('.v-input--error')).toHaveLength(1)
    })

    it('is not stopped by the empty required field of a row that would not be saved', async () => {
      const { save, alerts } = await mountOverlay(
        [
          editable('asset-1', { customData: { title: 'filled' } }),
          queueRow({ status: 'uploaded', assetId: 'asset-2' }),
          queueRow({
            status: 'failed',
            assetId: 'asset-3',
            error: { hasError: true, message: 'x', assetFileFailReason: 'none' },
          }),
        ],
        requiredTitle
      )

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved()).toEqual([[expect.objectContaining({ id: 'asset-1', customData: { title: 'filled' } })]])
    })

    // As it is today: the request is made by hand, and its failure is none of the errors the alert knows.
    it.each(refusals)(
      'keeps the queue, reads no list and says nothing when the save fails: %s',
      async (_name, refuse) => {
        server.on('PATCH', BULK, refuse)
        const { save, alerts, held, shown } = await mountOverlay([editable('asset-1')])

        save().click()
        await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
        // Its spinner stops, and it can be pressed again.
        await eventually(() =>
          expect([save().disabled, save().classList.contains('v-btn--loading')]).toEqual([false, false])
        )

        expect(alerts()).toEqual([])
        expect(server.sent('GET', LIST)).toEqual([])
        expect([held(), shown()]).toEqual([1, 'full'])
      }
    )
  })

  describe('its "save and finish" button', () => {
    it('saves as the save button does, then empties the queue, hides the overlay and reads the asset list', async () => {
      const { saveAndFinish, alerts, held, shown, rows } = await mountOverlay([
        editable('asset-1', { customData: { title: 'typed' } }),
        queueRow({ status: 'uploaded', assetId: 'asset-2' }),
      ])

      saveAndFinish()?.click()
      await eventually(() => expect(shown()).toBe('hidden'))

      expect(saved()).toEqual([
        [{ id: 'asset-1', keywords: [], authors: [], described: true, customData: { title: 'typed' } }],
      ])
      expect(alerts()).toEqual([UPDATED])
      expect(held()).toBe(0)
      // The rows are stopped, as the close button stops them: nothing asks about them any more.
      expect(rows.map((row) => row.status)).toEqual(['stop', 'stop'])
      await eventually(() => expect(sentTo(server.sent('GET', LIST))).toEqual(['GET /adm/v1/asset/licence/1/search']))
    })

    it('sends nothing and keeps the queue and the overlay while a row that would be saved is invalid', async () => {
      const { saveAndFinish, alerts, held, shown } = await mountOverlay([editable('asset-1')], requiredTitle)

      saveAndFinish()?.click()
      await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))

      expect(server.sent('PATCH')).toEqual([])
      expect([held(), shown()]).toEqual([1, 'full'])
    })

    it.each(refusals)(
      'keeps the queue and the overlay, and says nothing, when the save fails: %s',
      async (_name, refuse) => {
        server.on('PATCH', BULK, refuse)
        const { saveAndFinish, alerts, held, shown } = await mountOverlay([editable('asset-1')])

        saveAndFinish()?.click()
        await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
        await eventually(() => expect(saveAndFinish()?.classList.contains('v-btn--loading')).toBe(false))

        expect(alerts()).toEqual([])
        expect([held(), shown()]).toEqual([1, 'full'])
        expect(server.sent('GET', LIST)).toEqual([])
      }
    )
  })

  describe('its close button', () => {
    it('empties the queue and hides the overlay at once when every row is settled, and saves nothing', async () => {
      const { close, held, shown } = await mountOverlay([editable('asset-1', { customData: { title: 'typed' } })])

      close().click()
      await nextTick()

      expect([held(), shown()]).toEqual([0, 'hidden'])
      expect(dialogButton('Close')).toBeNull()
      expect(server.requests).toEqual([])
    })

    it('asks first while an upload is under way, and stops the uploads when the answer is yes', async () => {
      stubFileReader()
      const chunks: FakeDamRequest[] = []
      server.on('POST', /\/chunk$/, (request) => {
        chunks.push(request)

        return new Promise(() => undefined)
      })
      const { close, held, shown, store, rows } = await mountOverlay([
        queueRow({
          status: 'waiting',
          assetId: null,
          fileId: null,
          file: new File([new Uint8Array(2000)], 'photo.jpg', { type: 'image/jpeg' }),
        }),
      ])
      store.processUpload(QUEUE)
      await vi.advanceTimersByTimeAsync(0)
      expect([rows[0].status, chunks.length]).toEqual(['uploading', 1])

      close().click()
      await nextTick()

      expect(document.body.querySelector('.v-dialog')?.textContent).toContain(
        'Are you sure you want to stop the upload?'
      )
      expect([held(), shown(), chunks[0].config.signal?.aborted]).toEqual([1, 'full', false])

      dialogButton('Close')?.click()
      await vi.advanceTimersByTimeAsync(0)

      expect([held(), shown(), chunks[0].config.signal?.aborted]).toEqual([0, 'hidden', true])
      expect(rows[0].status).toBe('stop')
      expect(server.sent('PATCH')).toEqual([])
    })

    it('leaves everything as it is when the answer is no', async () => {
      const { close, held, shown } = await mountOverlay([queueRow({ status: 'processing' })])

      close().click()
      await nextTick()
      dialogButton('Cancel')?.click()
      await eventually(() => expect(dialogButton('Cancel')).toBeNull())

      expect([held(), shown()]).toEqual([1, 'full'])
    })
  })
})

describe('the overlay of the assets picked for mass edit', () => {
  const QUEUE = 'edit'
  const picked = (assetId: string, over: Partial<UploadQueueItem> = {}) => editable(assetId, { type: 'asset', ...over })

  /** Mounts the overlay, opened full, over the mass-edit queue holding the rows, their assets ticked in the list. */
  const mountOverlay = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}) => {
    const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, ...setup })
    const { useAssetFooterSelectedView } = await import('@/domains/coreDam/asset/composables/assetFooterSelected')
    const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
    const assetList = useAssetListStore()
    assetList.setList(
      [...rows.map((row) => assetDetail(row.assetId!)), assetDetail('asset-not-picked')] as never,
      ui.store.getQueueItems(QUEUE)
    )
    const view = useAssetFooterSelectedView()
    view.setFullSelected()
    const overlay = await ui.mount(
      () => import('@/domains/coreDam/asset/components/footer/AssetFooterSelectedFull.vue')
    )
    const toolbar = overlay.querySelector<HTMLElement>('.v-toolbar')!

    return {
      ...ui,
      overlay,
      toolbar,
      shown: () => view.footerViewSelected.value,
      held: () => ui.store.getQueueItems(QUEUE).length,
      ticked: () => assetList.list.filter((item) => item.selected).map((item) => item.asset.id),
      saveAndFinish: () => buttonsNamed(toolbar, SAVE_AND_FINISH)[0],
      save: () => iconButton(toolbar, 'mdi-content-save')!,
      clear: () => iconButton(toolbar, 'mdi-close')!,
    }
  }

  it('says how many assets are picked', async () => {
    const { toolbar } = await mountOverlay([picked('asset-1'), picked('asset-2')])

    expect(texts(toolbar)).toContain('Selected files: 2')
  })

  it('offers "save and finish" also while a picked asset is still loading its metadata', async () => {
    const { saveAndFinish } = await mountOverlay([
      picked('asset-1'),
      picked('asset-2', { status: 'loading', canEditMetadata: false }),
    ])

    expect(saveAndFinish()?.disabled).toBe(false)
  })

  describe('its save button', () => {
    it('sends the metadata of the picked assets and says so; the list is not read again, the selection stays', async () => {
      const { save, alerts, held, shown, ticked } = await mountOverlay([
        picked('asset-1', { keywords: ['keyword-1'], customData: { title: 'typed' }, mainFileSingleUse: false }),
        picked('asset-2'),
      ])

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved()).toEqual([
        [
          {
            id: 'asset-1',
            keywords: ['keyword-1'],
            authors: [],
            described: true,
            customData: { title: 'typed' },
            mainFileSingleUse: false,
          },
          { id: 'asset-2', keywords: [], authors: [], described: true, customData: {} },
        ],
      ])
      expect(server.sent('GET', LIST)).toEqual([])
      expect([held(), shown(), ticked()]).toEqual([2, 'full', ['asset-1', 'asset-2']])
    })

    it('sends nothing, and says what to do, while a picked asset has a required field empty', async () => {
      const { save, alerts } = await mountOverlay([picked('asset-1')], requiredTitle)

      save().click()
      await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))

      expect(server.sent('PATCH')).toEqual([])
    })
  })

  describe('its "save and finish" button', () => {
    it('saves, then empties the queue, unticks the assets in the list and hides the overlay', async () => {
      const { saveAndFinish, alerts, held, shown, ticked } = await mountOverlay([picked('asset-1'), picked('asset-2')])

      saveAndFinish().click()
      await eventually(() => expect(shown()).toBe('hidden'))

      expect(saved()).toHaveLength(1)
      expect(saved()[0].map((item: { id: string }) => item.id)).toEqual(['asset-1', 'asset-2'])
      expect(alerts()).toEqual([UPDATED])
      expect([held(), ticked()]).toEqual([0, []])
      expect(server.sent('GET', LIST)).toEqual([])
    })

    it('sends nothing and keeps the queue, the selection and the overlay while a picked asset is invalid', async () => {
      const { saveAndFinish, alerts, held, shown, ticked } = await mountOverlay([picked('asset-1')], requiredTitle)

      saveAndFinish().click()
      await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))

      expect(server.sent('PATCH')).toEqual([])
      expect([held(), shown(), ticked()]).toEqual([1, 'full', ['asset-1']])
    })

    // As in the overlay of the uploads: a save that fails is not reported.
    it.each(refusals)('keeps them all, and says nothing, when the save fails: %s', async (_name, refuse) => {
      server.on('PATCH', BULK, refuse)
      const { saveAndFinish, alerts, held, shown, ticked } = await mountOverlay([picked('asset-1')])

      saveAndFinish().click()
      await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
      await eventually(() => expect(saveAndFinish().classList.contains('v-btn--loading')).toBe(false))

      expect(alerts()).toEqual([])
      expect([held(), shown(), ticked()]).toEqual([1, 'full', ['asset-1']])
    })
  })

  describe('its close button', () => {
    it('asks first, then empties the queue, unticks the assets and hides the overlay, saving nothing', async () => {
      const { clear, held, shown, ticked } = await mountOverlay([picked('asset-1', { customData: { title: 'typed' } })])

      clear().click()
      await nextTick()

      expect(document.body.querySelector('.v-dialog')?.textContent).toContain(
        'Are you sure you want to clear selection?'
      )
      expect([held(), shown(), ticked()]).toEqual([1, 'full', ['asset-1']])

      dialogButton('Clear selected')?.click()
      await nextTick()

      expect([held(), shown(), ticked()]).toEqual([0, 'hidden', []])
      expect(server.sent('PATCH')).toEqual([])
    })

    it('leaves everything as it is when the answer is no', async () => {
      const { clear, held, shown, ticked } = await mountOverlay([picked('asset-1')])

      clear().click()
      await nextTick()
      dialogButton('Cancel')?.click()
      await eventually(() => expect(dialogButton('Cancel')).toBeNull())

      expect([held(), shown(), ticked()]).toEqual([1, 'full', ['asset-1']])
    })
  })
})
