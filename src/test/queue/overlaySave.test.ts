import type { UploadQueueItem } from '@anzusystems/common-admin'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  httpError,
  queueRow,
  stubFileReader,
  validationError,
} from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer, FakeDamRequest } from '@/test/support/fakeDam'
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

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SAVE_AND_FINISH = 'Save and finish'
const FIX_FIRST = 'Please fill all required fields and fix problems'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const FIX = 'Please, fix these errors'
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const LIST = /^\/adm\/v1\/asset\/licence\/1\/search$/

// Put into the queue as is: nothing is known of what the server has, so the save sends such a row whole.
const editable = (assetId: string, over: Partial<UploadQueueItem> = {}) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, assetId, fileId: 'file-of-' + assetId, ...over })

const iconButton = (within: ParentNode, icon: string) =>
  within.querySelector('.' + icon)?.closest<HTMLButtonElement>('button') ?? null

const texts = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? ''

const sentTo = (requests: FakeDamRequest[]) => requests.map((request) => request.method + ' ' + request.url)
const saved = () => server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))

const requiredTitle = { customForm: { image: [customField('title', { required: true })] } }
const titled = (name: string) => ({ ...customField('title'), name })
const namedTitle = { customForm: { image: [titled('Title of the photo')] } }

const failWith = (error: () => Error) => () => {
  throw error()
}

/*
 * A validation refusal names the field by its key in the batch that was sent.
 * The index is the place of the asset in that batch. The user is told the field name as the form shows it.
 */
const refusals: Array<[string, () => FakeDamAnswer, string]> = [
  ['a server error', failWith(() => httpError(500)), SYSTEM_ERROR],
  ['no access', failWith(() => httpError(403)), "Access denied, you don't have correct rights for this action"],
  [
    'a validation error',
    failWith(() => validationError({ '[0].customData.title': ['error_field_empty'] })),
    FIX + '\nTitle of the photo: Required field is empty.',
  ],
  ['an answer other than 200', () => ({ status: 204 }), SYSTEM_ERROR],
  [
    'no answer in time',
    failWith(() => new AxiosError('timeout of 30000ms exceeded', AxiosError.ECONNABORTED)),
    'Request to API timed out.',
  ],
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
      expect([held(), shown()]).toEqual([5, 'full'])
    })

    it('says so and reads the asset list again, with no request, when no row has anything to send', async () => {
      const { save, alerts, held, shown, store } = await mountOverlay([editable('asset-1'), editable('asset-2')])
      store.updateAssetMetadata(assetDetail('asset-1') as never)
      store.updateAssetMetadata(assetDetail('asset-2') as never)

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(server.sent('PATCH')).toEqual([])
      expect(sentTo(server.sent('GET', LIST))).toEqual(['GET /adm/v1/asset/licence/1/search'])
      expect([held(), shown()]).toEqual([2, 'full'])
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

    it.each(refusals)(
      'keeps the queue, reads no list and says why when the save fails: %s',
      async (_name, refuse, alert) => {
        server.on('PATCH', BULK, refuse)
        const { save, alerts, held, shown } = await mountOverlay([editable('asset-1')], namedTitle)

        save().click()
        await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
        await eventually(() =>
          expect([save().disabled, save().classList.contains('v-btn--loading')]).toEqual([false, false])
        )

        expect(alerts()).toEqual([alert])
        expect(server.sent('GET', LIST)).toEqual([])
        expect([held(), shown()]).toEqual([1, 'full'])
      }
    )

    it('says why a later batch failed, the batches before it sent and the queue kept', async () => {
      let batches = 0
      server.on('PATCH', BULK, (request) => {
        if (++batches === 2) throw validationError({ '[0].customData.title': ['error_field_empty'] })

        return { status: 200, data: JSON.parse(request.data as string) }
      })
      const rows = Array.from({ length: 21 }, (_, index) =>
        editable('asset-' + index, index === 10 ? { assetType: 'video' } : {})
      )
      const { save, alerts, held, shown } = await mountOverlay(rows, {
        customForm: { image: [titled('Title of the photo')], video: [titled('Title of the video')] },
      })

      save().click()
      await eventually(() => expect(alerts()).toEqual([FIX + '\nTitle of the video: Required field is empty.']))

      expect(saved().map((batch) => batch.length)).toEqual([10, 10])
      expect(server.sent('GET', LIST)).toEqual([])
      expect([held(), shown()]).toEqual([21, 'full'])
    })

    it('names each refused field once, by the asset of the batch it belongs to', async () => {
      server.on(
        'PATCH',
        BULK,
        failWith(() =>
          validationError({
            '[1].customData.title': ['error_field_empty'],
            '[2].customData.title': ['error_field_empty'],
            '[0].keywords': ['error_field_empty'],
          })
        )
      )
      const { save, alerts } = await mountOverlay(
        [editable('asset-1'), editable('asset-2', { assetType: 'video' }), editable('asset-3', { assetType: 'video' })],
        { customForm: { image: [titled('Title of the photo')], video: [titled('Title of the video')] } }
      )

      save().click()
      await eventually(() =>
        expect(alerts()).toEqual([
          FIX + '\nTitle of the video: Required field is empty.\nKeywords: Required field is empty.',
        ])
      )
    })
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
      expect(rows.map((row) => row.status)).toEqual(['stop', 'stop'])
      await eventually(() => expect(sentTo(server.sent('GET', LIST))).toEqual(['GET /adm/v1/asset/licence/1/search']))
    })

    it('empties the queue, hides the overlay and reads the asset list, with no request, when no row has anything to send', async () => {
      const { saveAndFinish, alerts, held, shown, store } = await mountOverlay([editable('asset-1')])
      store.updateAssetMetadata(assetDetail('asset-1') as never)

      saveAndFinish()?.click()
      await eventually(() => expect(shown()).toBe('hidden'))

      expect(server.sent('PATCH')).toEqual([])
      expect(alerts()).toEqual([UPDATED])
      expect(held()).toBe(0)
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
      'keeps the queue and the overlay, and says why, when the save fails: %s',
      async (_name, refuse, alert) => {
        server.on('PATCH', BULK, refuse)
        const { saveAndFinish, alerts, held, shown } = await mountOverlay([editable('asset-1')], namedTitle)

        saveAndFinish()?.click()
        await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
        await eventually(() => expect(saveAndFinish()?.classList.contains('v-btn--loading')).toBe(false))

        expect(alerts()).toEqual([alert])
        expect([held(), shown()]).toEqual([1, 'full'])
        expect(server.sent('GET', LIST)).toEqual([])
      }
    )
  })

  /*
   * The list panel showed an asset saved here as it was before the save.
   * Its own save would then overwrite what was saved here with the metadata it was loaded with.
   */
  describe.each([
    ['its save button', 'save'],
    ['its "save and finish" button', 'saveAndFinish'],
  ] as const)('%s and the panel of the list', (_button, press) => {
    it.each([
      ['reads the asset the panel shows when it was saved', 'asset-1', 1, ['saved']],
      ['leaves the panel alone when its asset was not saved', 'asset-not-uploaded', 0, ['before']],
    ] as const)('%s', async (_name, shownId, reads, keywords) => {
      const ui = await mountOverlay([editable('asset-1'), editable('asset-2')])
      const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
      const detail = useAssetDetailStore()
      detail.setAsset(assetDetail(shownId, { keywords: ['before'] }) as never)
      server.asset(assetDetail(shownId, { keywords: ['saved'] }))
      server.asset(assetDetail('asset-2'))

      ui[press]()!.click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      await vi.advanceTimersByTimeAsync(100)

      expect([server.assetReads(shownId), server.assetReads('asset-2'), detail.asset?.keywords]).toEqual([
        reads,
        0,
        keywords,
      ])
    })
  })

  describe('its close button', () => {
    it('empties the queue and hides the overlay at once when every row is settled, and saves nothing', async () => {
      const { close, held, shown } = await mountOverlay([editable('asset-1', { customData: { title: 'typed' } })])

      close().click()
      await nextTick()

      expect([held(), shown()]).toEqual([0, 'hidden'])
      expect(dialogButton('Stop')).toBeNull()
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

      expect(document.body.querySelector('.v-dialog')?.textContent).toContain('Do you want to stop the upload?')
      expect([held(), shown(), chunks[0].config.signal?.aborted]).toEqual([1, 'full', false])

      dialogButton('Stop')?.click()
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

  const pick = async (ui: Awaited<ReturnType<typeof mountOverlay>>, assets: Array<ReturnType<typeof assetDetail>>) => {
    assets.forEach((asset) => server.asset(asset))
    await ui.store.addByAssets(
      QUEUE,
      assets.map(({ id }) => ({
        id,
        attributes: { assetType: 'image', assetStatus: 'with_file' },
        texts: { displayTitle: id },
        mainFile: { id: 'file-of-' + id, links: {} },
        mainFileSingleUse: null,
      })) as never
    )
    await eventually(() =>
      expect(ui.store.getQueueItems(QUEUE).map((row) => row.status)).toEqual(assets.map(() => 'uploaded'))
    )
    const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
    useAssetListStore().setList([...assets, assetDetail('asset-not-picked')] as never, ui.store.getQueueItems(QUEUE))
  }
  const described = (assetId: string, yes = true) => assetDetail(assetId, { flags: { described: yes } })

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
    it('sends of the picked assets what was changed in them and says so; the list is not read again, the selection stays', async () => {
      const ui = await mountOverlay([], { customForm: { image: [customField('title')] } })
      const { save, alerts, held, shown, ticked, overlay } = ui
      await pick(ui, [described('asset-1'), described('asset-2', false), described('asset-3')])
      const title = overlay
        .querySelectorAll<HTMLElement>('.dam-upload-queue__item')[0]
        .querySelector<HTMLTextAreaElement>('textarea')!
      expect(title.value).toBe('from the server')

      title.value = 'typed'
      title.dispatchEvent(new Event('input'))
      await nextTick()
      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved()).toEqual([
        [
          { id: 'asset-1', described: true, customData: { title: 'typed' } },
          { id: 'asset-2', described: true },
        ],
      ])
      expect(server.sent('GET', LIST)).toEqual([])
      expect([held(), shown(), ticked()]).toEqual([3, 'full', ['asset-1', 'asset-2', 'asset-3']])
    })

    it('says so, with no request, when nothing was changed in picked assets that are described; the selection stays', async () => {
      const ui = await mountOverlay([])
      await pick(ui, [described('asset-1'), described('asset-2')])

      ui.save().click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))

      expect(server.sent('PATCH')).toEqual([])
      expect([ui.held(), ui.shown(), ui.ticked()]).toEqual([2, 'full', ['asset-1', 'asset-2']])
    })

    const panel = async (open: boolean, shownId: string) => {
      const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
      const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
      const { useMainWrapper } = await import('@/domains/system/composables/useMainWrapper')
      const detail = useAssetDetailStore()
      const { sidebarRight } = useMainWrapper()
      useAssetListStore().setActiveByIndex(1)
      sidebarRight.value = open
      detail.setAsset(assetDetail(shownId, { keywords: ['before'] }) as never)
      server.asset(assetDetail(shownId, { keywords: ['saved'] }))
      server.asset(assetDetail('asset-2'))
      onTestFinished(() => {
        sidebarRight.value = false
      })

      return { detail, sidebarRight }
    }
    const holdBulkSave = () => {
      let answer = () => undefined as void
      server.on(
        'PATCH',
        BULK,
        (request) =>
          new Promise<FakeDamAnswer>((resolve) => {
            answer = () => resolve({ status: 200, data: JSON.parse(request.data as string) })
          })
      )

      return () => answer()
    }
    const reads = (assetId: string, ...answers: Array<string | { held: string }>) => {
      const held: Array<() => void> = []
      let next = 0
      server.assetBy(assetId, () => {
        const answer = answers[Math.min(next++, answers.length - 1)]
        if (typeof answer === 'string') return assetDetail(assetId, { keywords: [answer] })

        return new Promise((resolve) => held.push(() => resolve(assetDetail(assetId, { keywords: [answer.held] }))))
      })

      return () => {
        const answer = held.shift()
        if (!answer) throw new Error(`no read of ${assetId} is held`)
        answer()
      }
    }
    const tilesOf = async (ui: Awaited<ReturnType<typeof mountOverlay>>) => {
      const tiles = await ui.mount(
        () => import('@/domains/coreDam/asset/components/list/components/AssetListTilesView.vue')
      )

      return async (index: number) => {
        tiles.querySelectorAll<HTMLElement>('.dam-image-grid__item')[index].click()
        await vi.advanceTimersByTimeAsync(0)
      }
    }

    it.each([
      ['reads the asset the open panel shows when it was saved, not the active row', 'asset-1', 1],
      ['leaves an open panel alone when its asset was not among them', 'asset-not-picked', 0],
    ] as const)('the panel of the list: %s', async (_name, shownId, reads) => {
      const { save, alerts } = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, shownId)

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))
      await vi.advanceTimersByTimeAsync(100)

      expect([server.assetReads(shownId), server.assetReads('asset-2')]).toEqual([reads, 0])
      expect(detail.asset?.keywords).toEqual(reads ? ['saved'] : ['before'])
    })

    // The toggle opens the panel on what the store holds, without a read.
    // Otherwise it opens on the asset from before the save, and its own save undoes this one.
    it('the panel of the list: reads its asset while it is closed too, so that it opens on what was saved', async () => {
      const { save, alerts } = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail, sidebarRight } = await panel(false, 'asset-1')

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))
      await vi.advanceTimersByTimeAsync(100)
      sidebarRight.value = true
      await vi.advanceTimersByTimeAsync(100)

      expect([server.assetReads('asset-1'), server.assetReads('asset-2')]).toEqual([1, 0])
      expect(detail.asset?.keywords).toEqual(['saved'])
    })

    /*
     * A detail read in flight when the save answers can return the asset as it was before the save.
     * It is let land, because throwing it away left its loader up over the asset.
     * The asset is read again if it was one of the saved; the loader comes down after that.
     */
    it('the panel of the list: reads again a saved asset whose read was on its way when the save answered', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      const answerSave = holdBulkSave()
      const answerRead = reads('asset-2', { held: 'before' }, 'saved')

      ui.save().click()
      await vi.advanceTimersByTimeAsync(0)
      await click(1)
      answerSave()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      answerRead()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-2', ['saved'], false])
      expect([server.assetReads('asset-1'), server.assetReads('asset-2')]).toEqual([0, 2])
    })

    it('reads again the saved asset of the edit button of a row, whose read was on its way when the save answered', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const answerSave = holdBulkSave()
      const answerRead = reads('asset-2', { held: 'before' }, 'saved')

      ui.save().click()
      await vi.advanceTimersByTimeAsync(0)
      const card = ui.overlay.querySelectorAll<HTMLElement>('.dam-upload-queue__item')[1]
      buttonsNamed(card, 'Edit more')[0].click()
      await vi.advanceTimersByTimeAsync(0)
      answerSave()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      answerRead()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.detail, detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual([
        true,
        'asset-2',
        ['saved'],
        false,
      ])
      expect([server.assetReads('asset-1'), server.assetReads('asset-2')]).toEqual([0, 2])
    })

    it('the panel of the list: reads again its own asset whose read was on its way when the save answered', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      const answerSave = holdBulkSave()
      const answerRead = reads('asset-1', { held: 'before' }, 'saved')

      ui.save().click()
      await vi.advanceTimersByTimeAsync(0)
      await click(0)
      answerSave()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      answerRead()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-1', ['saved'], false])
      expect(server.assetReads('asset-1')).toBe(2)
    })

    it('the panel of the list: trusts a read that started after the save answered, and reads it once', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      reads('asset-2', 'saved', 'read again')

      ui.save().click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      await vi.advanceTimersByTimeAsync(100)
      await click(1)
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-2', ['saved'], false])
      expect(server.assetReads('asset-2')).toBe(1)
    })

    // The newer read, asked after the save, throws away the older read.
    it('the panel of the list: reads once a saved asset clicked after the save, over a read from before it', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      const answerSave = holdBulkSave()
      const answerOlder = reads('asset-1', { held: 'before' })
      reads('asset-2', 'saved', 'read again')

      ui.save().click()
      await vi.advanceTimersByTimeAsync(0)
      await click(0)
      answerSave()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      await click(1)
      answerOlder()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-2', ['saved'], false])
      expect([server.assetReads('asset-1'), server.assetReads('asset-2')]).toEqual([1, 1])
    })

    /*
     * The list skips the read of the asset fetched last within five seconds.
     * After the save that would keep a saved asset in its pre-save
     * state if the read again was thrown away by a newer read.
     */
    it.each([
      ['clicked again', [0]],
      ['clicked again after another asset', [1, 0]],
    ] as const)(
      'the panel of the list: reads a saved asset fetched just before the save when it is %s',
      async (_name, clicks) => {
        const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
        const { detail } = await panel(true, 'asset-1')
        const click = await tilesOf(ui)
        const answerReadAgain = reads('asset-1', 'before', { held: 'stale' }, 'saved')
        const answerOther = reads('asset-2', { held: 'other' })
        await click(0)
        expect(detail.asset?.keywords).toEqual(['before'])

        ui.save().click()
        await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
        for (const index of clicks) await click(index)
        if (clicks.length > 1) answerOther()
        answerReadAgain()
        await vi.advanceTimersByTimeAsync(100)

        expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-1', ['saved'], false])
        expect(server.assetReads('asset-1')).toBe(3)
      }
    )

    // The shortcut is dropped when the save answers, also while another read is in flight and the read again waits.
    it('the panel of the list: reads a saved asset clicked again while a read from before the save is on its way', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      const answerSave = holdBulkSave()
      reads('asset-1', 'before', 'saved')
      const answerOther = reads('asset-not-picked', { held: 'other' })
      await click(0)
      await click(2)

      ui.save().click()
      await vi.advanceTimersByTimeAsync(0)
      answerSave()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      await click(0)
      answerOther()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-1', ['saved'], false])
      expect(server.assetReads('asset-1')).toBe(2)
    })

    // A click before the read again: the read from before the save lands and stamps its asset as fetched last.
    it('the panel of the list: reads a saved asset clicked again while it is read again after a read from before the save', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      const answerSave = holdBulkSave()
      const answer = reads('asset-1', { held: 'before' }, { held: 'stale' }, 'saved')

      ui.save().click()
      await vi.advanceTimersByTimeAsync(0)
      await click(0)
      answerSave()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      answer()
      await vi.advanceTimersByTimeAsync(0)
      expect([detail.asset?.keywords, server.assetReads('asset-1')]).toEqual([['before'], 2])
      await click(0)
      answer()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-1', ['saved'], false])
      expect(server.assetReads('asset-1')).toBe(3)
    })

    /*
     * The shortcut goes by the asset the list fetched last.
     * Editing a queue row writes another asset into the detail without that stamp.
     * A click on the asset fetched last must then be read, not assumed to be what the detail holds.
     */
    it('the panel of the list: reads the asset clicked, fetched last, when the edit of a row put another in the detail', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      reads('asset-not-picked', 'other')
      const answerReadAgain = reads('asset-1', 'before', { held: 'saved' })
      await click(2)
      const card = ui.overlay.querySelectorAll<HTMLElement>('.dam-upload-queue__item')[0]
      buttonsNamed(card, 'Edit more')[0].click()
      await vi.advanceTimersByTimeAsync(0)
      expect([detail.asset?.id, detail.asset?.keywords]).toEqual(['asset-1', ['before']])

      ui.save().click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      await click(2)
      answerReadAgain()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.loader]).toEqual(['asset-not-picked', false])
      expect(server.assetReads('asset-not-picked')).toBe(2)
    })

    it('the panel of the list: keeps its loader up while its asset is read again', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const answerReadAgain = reads('asset-1', { held: 'saved' })

      ui.save().click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      expect([detail.loader, detail.asset?.keywords]).toEqual([true, ['before']])

      answerReadAgain()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.loader, detail.asset?.keywords]).toEqual([false, ['saved']])
    })

    // The second save no longer sends the asset: what the first save asked for after the in-flight read still holds.
    it('the panel of the list: reads again an asset of the first of two saves answered while its read was on its way', async () => {
      const ui = await mountOverlay([picked('asset-1'), picked('asset-2')])
      const { detail } = await panel(true, 'asset-1')
      const click = await tilesOf(ui)
      const answerRead = reads('asset-2', { held: 'before' }, 'saved')
      await click(1)

      ui.save().click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
      ui.store.removeByAssetId(QUEUE, 'asset-2')
      await nextTick()
      ui.save().click()
      await eventually(() => expect(ui.alerts()).toEqual([UPDATED, UPDATED]))
      answerRead()
      await vi.advanceTimersByTimeAsync(100)

      expect([detail.asset?.id, detail.asset?.keywords, detail.loader]).toEqual(['asset-2', ['saved'], false])
      expect(server.assetReads('asset-2')).toBe(2)
    })

    it('sends a picked asset whose file was processed after it had failed, with what was typed', async () => {
      const { save, alerts, store } = await mountOverlay([
        picked('asset-1', { keywords: ['keyword-1'], customData: { title: 'typed' } }),
        picked('asset-2'),
      ])
      server.asset(assetDetail('asset-1'))
      store.queueItemFailed('asset-1', 'unknown', 'file-of-asset-1')
      void store.queueItemProcessed('asset-1', 'file-of-asset-1')
      await vi.advanceTimersByTimeAsync(1000)

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(
        saved()[0].map((item: { id: string; keywords: string[]; customData: object }) => [
          item.id,
          item.keywords,
          item.customData,
        ])
      ).toEqual([
        ['asset-1', ['keyword-1'], { title: 'typed' }],
        ['asset-2', [], {}],
      ])
    })

    // The server may still fill in its metadata from the file.
    // There is no form for it, so nothing of it is sent.
    it('leaves out a picked asset whose file the server is still processing, and sends the others', async () => {
      const { save, alerts, store, overlay } = await mountOverlay([])
      const listed = (id: string) => ({
        id,
        attributes: { assetType: 'image', assetStatus: 'with_file' },
        texts: { displayTitle: id },
        mainFile: { id: 'file-of-' + id, links: {} },
        mainFileSingleUse: null,
      })
      server.asset(
        assetDetail('asset-1', {
          flags: { described: false },
          mainFile: assetFile('file-of-asset-1', 'stored', { asset: 'asset-1' }),
        })
      )
      server.asset(assetDetail('asset-2', { flags: { described: false } }))

      await store.addByAssets(QUEUE, [listed('asset-1'), listed('asset-2')] as never)
      await eventually(() =>
        expect(store.getQueueItems(QUEUE).map((row) => row.status)).toEqual(['failed', 'uploaded'])
      )
      expect(texts(overlay)).toContain(
        'The asset file is still being processed. Remove the item and select it again once it is processed.'
      )

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved().map((batch: Array<{ id: string }>) => batch.map((item) => item.id))).toEqual([['asset-2']])
    })

    it('sends nothing, and says what to do, while a picked asset has a required field empty', async () => {
      const { save, alerts } = await mountOverlay([picked('asset-1')], requiredTitle)

      save().click()
      await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))

      expect(server.sent('PATCH')).toEqual([])
    })

    it.each(refusals)('keeps them all, and says why, when the save fails: %s', async (_name, refuse, alert) => {
      server.on('PATCH', BULK, refuse)
      const { save, alerts, held, shown, ticked } = await mountOverlay([picked('asset-1')], namedTitle)

      save().click()
      await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
      await eventually(() =>
        expect([save().disabled, save().classList.contains('v-btn--loading')]).toEqual([false, false])
      )

      expect(alerts()).toEqual([alert])
      expect([held(), shown(), ticked()]).toEqual([1, 'full', ['asset-1']])
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

    it('empties the queue, unticks the assets and hides the overlay, with no request, when nothing was changed in picked assets that are described', async () => {
      const ui = await mountOverlay([])
      await pick(ui, [described('asset-1'), described('asset-2')])

      ui.saveAndFinish().click()
      await eventually(() => expect(ui.shown()).toBe('hidden'))

      expect(server.sent('PATCH')).toEqual([])
      expect(ui.alerts()).toEqual([UPDATED])
      expect([ui.held(), ui.ticked()]).toEqual([0, []])
    })

    it('sends nothing and keeps the queue, the selection and the overlay while a picked asset is invalid', async () => {
      const { saveAndFinish, alerts, held, shown, ticked } = await mountOverlay([picked('asset-1')], requiredTitle)

      saveAndFinish().click()
      await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))

      expect(server.sent('PATCH')).toEqual([])
      expect([held(), shown(), ticked()]).toEqual([1, 'full', ['asset-1']])
    })

    it.each(refusals)('keeps them all, and says why, when the save fails: %s', async (_name, refuse, alert) => {
      server.on('PATCH', BULK, refuse)
      const { saveAndFinish, alerts, held, shown, ticked } = await mountOverlay([picked('asset-1')], namedTitle)

      saveAndFinish().click()
      await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
      await eventually(() => expect(saveAndFinish().classList.contains('v-btn--loading')).toBe(false))

      expect(alerts()).toEqual([alert])
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
