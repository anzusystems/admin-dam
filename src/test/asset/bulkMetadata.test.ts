import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import type { Component } from 'vue'
import { VLayout } from 'vuetify/components'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow, validationError } from '@/test/support/fakeDam'
import type { FakeAssetFile, FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/*
 * Saving asset metadata, both ways the app does it: the bulk save of a queue (ten
 * assets per request), and the save of one asset from its detail or the right-hand list
 * panel. Both use the same endpoint, and a failed save says why, like other requests.
 * What the two queue overlays tell the user is tested in `queue/overlaySave.test.ts`.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const saved = () => server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))

const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const ACCESS_DENIED = "Access denied, you don't have correct rights for this action"
const FIX = 'Please, fix these errors'
const UPDATED = 'Record was updated'

const queueItem = (over: Record<string, unknown> = {}) => ({
  assetId: 'asset-1',
  canEditMetadata: true,
  keywords: ['keyword-1'],
  authors: ['author-1'],
  customData: { headline: 'x' },
  mainFileSingleUse: null,
  mainFileInternal: null,
  ...over,
})

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())

  return {
    library: await import('@anzusystems/common-admin'),
    api: await import('@/domains/coreDam/asset/api/assetApi'),
  }
}

type Library = Awaited<ReturnType<typeof load>>['library']

const answerWith = (answer: FakeDamAnswer) => () => answer
const failWith = (error: () => Error) => () => {
  throw error()
}

const timedOut = () => new AxiosError('timeout of 30000ms exceeded', AxiosError.ECONNABORTED)
const unreachable = () => new AxiosError('Network Error', AxiosError.ERR_NETWORK)

beforeEach(() => {
  server = createFakeDam()
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  stopUploadUi()
})

describe('bulk metadata update', () => {
  it('sends only the fields this form edits', async () => {
    const { api } = await load()

    await api.bulkUpdateAssetsMetadata([queueItem()] as never)

    // A field left out of the payload is one this save does not write. The rules still run afterwards.
    expect(saved()).toEqual([
      [
        {
          id: 'asset-1',
          keywords: ['keyword-1'],
          authors: ['author-1'],
          described: true,
          customData: { headline: 'x' },
        },
      ],
    ])
  })

  it('sends the one flag it does edit, once it is known', async () => {
    const { api } = await load()

    await api.bulkUpdateAssetsMetadata([queueItem({ mainFileSingleUse: true })] as never)

    expect(saved()[0][0].mainFileSingleUse).toBe(true)
  })

  it('leaves that flag out while it is still unknown', async () => {
    const { api } = await load()

    // `null` is the factory default, not a value the user chose.
    await api.bulkUpdateAssetsMetadata([queueItem({ mainFileSingleUse: null })] as never)

    expect('mainFileSingleUse' in saved()[0][0]).toBe(false)
  })

  it('counts its batches from the items it is going to send', async () => {
    const { api } = await load()
    // Eleven selected, one editable: the mapping drops duplicates and failures.
    const items = [queueItem(), ...Array.from({ length: 10 }, () => queueItem({ canEditMetadata: false }))]

    await api.bulkUpdateAssetsMetadata(items as never)

    // Counting from the input used to send a second PATCH with an empty body.
    expect(saved()).toHaveLength(1)
    expect(saved()[0]).toHaveLength(1)
  })

  it('splits a batch larger than the limit', async () => {
    const { api } = await load()
    const items = Array.from({ length: 23 }, (_, index) => queueItem({ assetId: `asset-${index}` }))

    await api.bulkUpdateAssetsMetadata(items as never)

    expect(saved().map((batch) => batch.length)).toEqual([10, 10, 3])
  })

  it('stops at the batch that fails: the ones before it are sent, the ones after it are not', async () => {
    const { api } = await load()
    let batches = 0
    server.on('PATCH', BULK, (request) => {
      if (++batches === 2) throw httpError(500)

      return { status: 200, data: JSON.parse(request.data as string) }
    })
    const items = Array.from({ length: 23 }, (_, index) => queueItem({ assetId: `asset-${index}` }))

    await expect(api.bulkUpdateAssetsMetadata(items as never)).rejects.toThrow()

    expect(saved().map((batch) => batch.length)).toEqual([10, 10])
  })
})

/*
 * How each save fails, by what the server did: the error kinds the
 * alerts know, as for any request made through the library helpers.
 * Only a 200 carries the saved metadata. Any other answer, including other 2xx, is a failed save.
 */
const failures: Array<[string, () => FakeDamAnswer, (library: Library, error: unknown) => boolean]> = [
  ['no access (403)', failWith(() => httpError(403)), (library, error) => library.isAnzuApiForbiddenError(error)],
  [
    'a validation error (422)',
    failWith(() => validationError({ '[0].keywords': ['error_field_empty'] })),
    (library, error) => library.isAnzuApiValidationError(error),
  ],
  ['a server error (500)', failWith(() => httpError(500)), (library, error) => library.isAnzuApiAxiosError(error)],
  ['no content (204)', answerWith({ status: 204 }), (library, error) => library.isAnzuApiAxiosError(error)],
  [
    'an answer other than 200, with a body (201)',
    answerWith({ status: 201, data: [] }),
    (library, error) => library.isAnzuApiAxiosError(error),
  ],
  ['no network', failWith(unreachable), (library, error) => library.isAnzuApiAxiosError(error)],
  ['no answer in time', failWith(timedOut), (library, error) => library.isAnzuApiTimeoutError(error)],
]

// What is logged for the api error logger, as for other requests:
// not a refusal of the user's rights or of what the user typed.
const reported: Array<[string, () => FakeDamAnswer, boolean]> = [
  ['a server error (500)', failWith(() => httpError(500)), true],
  ['not signed in (401)', failWith(() => httpError(401)), false],
  ['no access (403)', failWith(() => httpError(403)), false],
  ['a validation error (422)', failWith(() => validationError({ '[0].keywords': ['error_field_empty'] })), false],
]

const saves: Array<[string, (api: Awaited<ReturnType<typeof load>>['api']) => Promise<unknown>]> = [
  ['the bulk save', (api) => api.bulkUpdateAssetsMetadata([queueItem()] as never)],
  [
    'the save of one asset',
    (api) => api.updateAssetMetadata(assetDetail('asset-1') as never, null, false, false, false),
  ],
]

describe.each(saves)('%s', (_name, save) => {
  it.each(failures)('fails with the error the alerts know: %s', async (_failure, refuse, isKind) => {
    const { library, api } = await load()
    server.on('PATCH', BULK, refuse)

    const failed = await save(api).then(
      () => undefined,
      (error: unknown) => error
    )

    expect(isKind(library, failed)).toBe(true)
  })

  it.each(reported)('writes the failure down, or not, as the other requests do: %s', async (_failure, refuse, kept) => {
    const { library, api } = await load()
    const logged: Array<number | undefined> = []
    library.setApiErrorLogger((_error, context) => {
      logged.push(context.status)
    })
    server.on('PATCH', BULK, refuse)

    await expect(save(api)).rejects.toBeDefined()

    expect(logged.length).toBe(kept ? 1 : 0)
  })

  it('is done once the server saved it', async () => {
    const { api } = await load()

    await save(api)

    expect(saved()).toHaveLength(1)
  })
})

describe('the save of one asset', () => {
  const titled = (name: string) => ({ ...customField('title'), name })
  const namedTitle: Partial<UploadUiSetup> = { customForm: { image: [titled('Title of the photo')] } }

  const panels: Array<[string, () => Promise<Component>]> = [
    [
      'from its detail',
      async () => {
        const Sidebar = (
          await import('@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarMetadata.vue')
        ).default
        const { useAssetDetailSidebarActionbar } =
          await import('@/domains/coreDam/asset/components/detail/composables/assetDetailSidebarActionbar')

        return defineComponent({
          setup() {
            useAssetDetailSidebarActionbar().mounted()

            return () => [
              h('div', { id: 'anzu-asset-detail-sidebar-actions' }),
              h(Sidebar, { isActive: true, assetType: 'image' }),
            ]
          },
        })
      },
    ],
    [
      'from the panel on the right of the list',
      async () => {
        const Sidebar = (
          await import('@/domains/coreDam/asset/components/list/components/AssetListSidebarMetadata.vue')
        ).default

        return defineComponent({ setup: () => () => h(VLayout, null, () => h(Sidebar)) })
      },
    ],
  ]

  const mountPanel = async (
    panel: () => Promise<Component>,
    setup: Partial<UploadUiSetup> = {},
    asset: ReturnType<typeof assetDetail> = assetDetail('asset-1')
  ) => {
    server.on('GET', /^\/adm\/v1\/(keyword|author)\//, () => ({ status: 200, data: { data: [] } }))
    const ui = await startUploadUi({ server, ...setup })
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    useAssetDetailStore().setAsset(asset as never)
    const root = await ui.mount(async () => ({ default: await panel() }))

    return { ...ui, root, save: () => buttonsNamed(root, 'Save')[0] }
  }

  const STILL_PROCESSING =
    'The file is still being processed. You can save once it is processed; then open the asset again.'
  const notDescribed = (status: FakeAssetFile['fileAttributes']['status'], described = false) =>
    assetDetail('asset-1', { flags: { described }, mainFile: assetFile('file-1', status, { asset: 'asset-1' }) })

  describe.each(panels)('%s', (_where, panel) => {
    // The server may still fill in the metadata of the asset from its file. A save now would overwrite that.
    it.each(['uploading', 'uploaded', 'stored'] as const)(
      'keeps Save off, and says why, while the file of an asset nobody described is with the server: %s',
      async (status) => {
        const { save, root } = await mountPanel(panel, namedTitle, notDescribed(status))

        expect(save().disabled).toBe(true)
        expect(root.textContent).toContain(STILL_PROCESSING)
        // Not in the detail's actions bar, which has a fixed height.
        expect(root.querySelector('#anzu-asset-detail-sidebar-actions')?.textContent ?? '').not.toContain(
          STILL_PROCESSING
        )
      }
    )

    it.each([
      ['its file is processed', notDescribed('processed')],
      ['its file has failed', notDescribed('failed')],
      ['the asset is described', notDescribed('stored', true)],
    ])('lets Save be pressed, and says nothing of it, when %s', async (_state, asset) => {
      const { save, root } = await mountPanel(panel, namedTitle, asset)

      expect(save().disabled).toBe(false)
      expect(root.textContent).not.toContain(STILL_PROCESSING)
    })

    // Whatever the detail was opened from, a later bulk save would otherwise send the row as it was before.
    it('writes what it saved into the row of the asset in the mass-edit queue', async () => {
      const picked = queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, keywords: ['old'] })
      const { save, alerts, store } = await mountPanel(panel, { ...namedTitle, queues: { edit: [picked] } })

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      const [row] = store.getQueueItems('edit')
      expect([row.keywords, row.authors, row.customData]).toEqual([
        ['keyword-server'],
        ['author-server'],
        { title: 'from the server' },
      ])
    })

    it('writes into the row of the asset it saved, though another asset was opened while it was on the wire', async () => {
      const first = queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, keywords: ['old-1'] })
      const second = queueRow({
        type: 'asset',
        status: 'uploaded',
        canEditMetadata: true,
        assetId: 'asset-2',
        keywords: ['old-2'],
      })
      let answer: () => void = () => undefined
      server.on('PATCH', BULK, () => new Promise((resolve) => (answer = () => resolve({ status: 200, data: [] }))))
      const { save, alerts, store } = await mountPanel(panel, { ...namedTitle, queues: { edit: [first, second] } })

      save().click()
      await eventually(() => expect(saved()).toHaveLength(1))
      const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
      useAssetDetailStore().setAsset(assetDetail('asset-2', { keywords: ['keyword-of-asset-2'] }) as never)
      answer()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      const [row1, row2] = store.getQueueItems('edit')
      expect([row1.keywords, row2.keywords]).toEqual([['keyword-server'], ['old-2']])
    })

    // The switch belongs to the panel. The asset carries the value it was opened with.
    it('writes the single-use switch it saved into the row, not the one the asset was opened with', async () => {
      const picked = queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, mainFileSingleUse: false })
      const { save, alerts, store } = await mountPanel(panel, { ...namedTitle, queues: { edit: [picked] } })
      const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
      useAssetDetailStore().mainFileSingleUse = true

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved()[0][0].mainFileSingleUse).toBe(true)
      expect(store.getQueueItems('edit')[0].mainFileSingleUse).toBe(true)
    })

    it('says so when it is saved', async () => {
      const { save, alerts } = await mountPanel(panel, namedTitle)

      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(saved()).toHaveLength(1)
    })

    // The server names a field by its key in the list that was
    // sent. The user is told once, using the form's name for it.
    it.each([
      ['a custom field', '[0].customData.title', 'Title of the photo'],
      ['the keywords', '[0].keywords', 'Keywords'],
    ])('says once which field to fix when the server refuses %s', async (_field, key, name) => {
      server.on(
        'PATCH',
        BULK,
        failWith(() => validationError({ [key]: ['error_field_empty'] }))
      )
      const { save, alerts } = await mountPanel(panel, namedTitle)

      save().click()
      await eventually(() => expect(alerts()).not.toEqual([]))
      await vi.advanceTimersByTimeAsync(100)

      expect(alerts()).toEqual([FIX + '\n' + name + ': Required field is empty.'])
    })

    it.each([
      ['a server error (500)', failWith(() => httpError(500)), SYSTEM_ERROR],
      ['no access (403)', failWith(() => httpError(403)), ACCESS_DENIED],
      ['an answer other than 200 (201)', answerWith({ status: 201, data: [] }), SYSTEM_ERROR],
      ['no content (204)', answerWith({ status: 204 }), SYSTEM_ERROR],
    ])('says why when the save fails: %s', async (_failure, refuse, alert) => {
      server.on('PATCH', BULK, refuse)
      const { save, alerts } = await mountPanel(panel, namedTitle)

      save().click()
      await eventually(() => expect(alerts()).toEqual([alert]))
    })
  })

  /*
   * The Save of the right-hand list panel stands out while its form holds unsaved changes. It stops standing
   * out when the save is sent, so input typed during the request still shows. A failed save has saved nothing.
   */
  describe('from the panel on the right of the list: its Save stands out while something is not saved', () => {
    const panel = panels[1][1]
    const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')
    const typeTitle = async (root: HTMLElement, value: string) => {
      const title = root.querySelector<HTMLTextAreaElement>('textarea')!
      title.value = value
      title.dispatchEvent(new Event('input'))
      await nextTick()
    }
    const heldSave = () => {
      const held = { answer: () => undefined as void, fail: () => undefined as void }
      server.on(
        'PATCH',
        BULK,
        () =>
          new Promise((resolve, reject) => {
            held.answer = () => resolve({ status: 200, data: [] })
            held.fail = () => reject(httpError(500))
          })
      )

      return held
    }
    const openAsset = async (asset: ReturnType<typeof assetDetail>) => {
      const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
      useAssetDetailStore().setAsset(asset as never)
      await nextTick()
    }

    it('stands out once the form is typed into, and no longer after a save that went through', async () => {
      const { save, alerts, root } = await mountPanel(panel, namedTitle)
      expect(standsOut(save())).toBe(false)

      await typeTitle(root, 'typed')
      expect(standsOut(save())).toBe(true)
      save().click()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(standsOut(save())).toBe(false)
    })

    // Form switches are sent with the same save as its fields. The asset here is read with one of them on.
    it('stands out once a switch of the form is changed, not for a switch the asset was read with', async () => {
      const { save, root } = await mountPanel(panel, namedTitle, assetDetail('asset-1', { mainFileSingleUse: true }))
      const singleUse = root.querySelector<HTMLInputElement>('.v-switch input')!
      expect([singleUse.checked, standsOut(save())]).toEqual([true, false])

      singleUse.click()
      await nextTick()

      expect([singleUse.checked, standsOut(save())]).toEqual([false, true])
    })

    // Regression: after a failed save it looked as if nothing was left to save (finding 56).
    it('stands out again after a save that failed', async () => {
      server.on(
        'PATCH',
        BULK,
        failWith(() => httpError(500))
      )
      const { save, alerts, root } = await mountPanel(panel, namedTitle)
      await typeTitle(root, 'typed')

      save().click()
      await eventually(() => expect(alerts()).toEqual([SYSTEM_ERROR]))

      expect(standsOut(save())).toBe(true)
    })

    it('does not stand out after a failed save of a form nothing was typed into', async () => {
      server.on(
        'PATCH',
        BULK,
        failWith(() => httpError(500))
      )
      const { save, alerts } = await mountPanel(panel, namedTitle)

      save().click()
      await eventually(() => expect(alerts()).toEqual([SYSTEM_ERROR]))

      expect(standsOut(save())).toBe(false)
    })

    it('stands out after a save that went through, for what was typed while it was on the wire', async () => {
      const held = heldSave()
      const { save, alerts, root } = await mountPanel(panel, namedTitle)
      await typeTitle(root, 'typed')
      save().click()
      await eventually(() => expect(saved()).toHaveLength(1))
      expect(standsOut(save())).toBe(false)

      await typeTitle(root, 'typed while the save was on the wire')
      held.answer()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))

      expect(standsOut(save())).toBe(true)
    })

    /*
     * The button spins only while a save is on the wire, so a second one can be
     * started. Each save is held until the case ends it, in the given order.
     */
    const twoSaves = async (between: () => Promise<void> = async () => undefined) => {
      const ends: Array<{ answer: () => void; fail: () => void }> = []
      server.on(
        'PATCH',
        BULK,
        () =>
          new Promise((resolve, reject) => {
            ends.push({ answer: () => resolve({ status: 200, data: [] }), fail: () => reject(httpError(500)) })
          })
      )
      const mounted = await mountPanel(panel, namedTitle)
      await typeTitle(mounted.root, 'typed')
      mounted.save().click()
      await eventually(() => expect(ends).toHaveLength(1))
      await between()
      mounted.save().click()
      await eventually(() => expect(ends).toHaveLength(2))

      return { ...mounted, first: ends[0], second: ends[1] }
    }

    // The later save sent the current form and succeeded, so the earlier failure says nothing about the form.
    it('does not stand out after a save that failed when a save started after it had gone through', async () => {
      const { save, alerts, first, second } = await twoSaves()

      second.answer()
      await eventually(() => expect(alerts()).toEqual([UPDATED]))
      first.fail()
      await eventually(() => expect(alerts()).toEqual([UPDATED, SYSTEM_ERROR]))

      expect(standsOut(save())).toBe(false)
    })

    it.each([
      ['the earlier one first', ['first', 'second']],
      ['the later one first', ['second', 'first']],
    ] as const)('stands out when both of two saves on the wire at once failed, %s', async (_order, order) => {
      const saves = await twoSaves()

      saves[order[0]].fail()
      await eventually(() => expect(saves.alerts()).toEqual([SYSTEM_ERROR]))
      saves[order[1]].fail()
      await eventually(() => expect(saves.alerts()).toEqual([SYSTEM_ERROR, SYSTEM_ERROR]))

      expect(standsOut(saves.save())).toBe(true)
    })

    // The save still in flight took data off the previous asset. This asset must not put it back.
    it('does not stand out after a failed save of an asset opened while the save of another was on the wire', async () => {
      const { save, alerts, second } = await twoSaves(() => openAsset(assetDetail('asset-2')))

      second.fail()
      await eventually(() => expect(alerts()).toEqual([SYSTEM_ERROR]))

      expect(standsOut(save())).toBe(false)
    })

    // The form of the failed save is gone. The form in the panel now comes from the server unchanged.
    it.each([
      ['another asset was opened', assetDetail('asset-2')],
      ['the same asset was read again', assetDetail('asset-1')],
    ])('does not stand out after a save that failed when %s while it was on the wire', async (_what, opened) => {
      const held = heldSave()
      const { save, alerts, root } = await mountPanel(panel, namedTitle)
      await typeTitle(root, 'typed')
      save().click()
      await eventually(() => expect(saved()).toHaveLength(1))

      await openAsset(opened)
      held.fail()
      await eventually(() => expect(alerts()).toEqual([SYSTEM_ERROR]))

      expect(standsOut(save())).toBe(false)
    })
  })
})
