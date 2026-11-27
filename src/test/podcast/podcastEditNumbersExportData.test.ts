import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The orders of a podcast are whole numbers the server keeps unsigned. An emptied field used to be sent as "",
 * which the server stores as 0 and so moved the podcast to the top, and a negative one failed with a server error.
 * Export data: the server takes each pair of export type and device type once per podcast. Two rows with the same
 * pair failed with a server error. A pair another row gives up in the same save is refused by the server as
 * not unique, and the row it names must say so.
 * core-dam keeps no order of export data: it answers the rows in its own order and drops a sent `position`.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const ONE = /^\/adm\/v1\/podcast\/([^/]+)$/
const PODCAST = '01a21db4-205e-736e-bd57-fb727619fad1'
const TAKEN = 'Another row already has this export type with this device type.'
const REFUSED = 'The server refused this pair'
const GET_PAST_REFUSED =
  'Give this row another pair for now, its previous one for example, save, then set this pair again.'
const FIX_FIRST = 'Please fill all required fields and fix problems'

// As core-dam answers a row: without a position.
const exportRow = (id: number, exportType: string, deviceType: string) => ({
  id,
  exportType,
  deviceType,
  podcast: PODCAST,
  body: {},
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'podcastExportData',
  _system: 'coreDam',
})

let exportData: ReturnType<typeof exportRow>[] = []

const record = () => ({
  id: PODCAST,
  licence: 1,
  texts: { title: 'QA podcast', description: '' },
  attributes: {
    rssUrl: '',
    extUrl: '',
    mode: 'not_importing',
    lastImportStatus: 'not_imported',
    webOrderPosition: 7600,
    mobileOrderPosition: 5,
  },
  exportData: structuredClone(exportData),
  flags: { webPublicExportEnabled: false, mobilePublicExportEnabled: false },
  dates: { importFrom: null },
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  imagePreview: null,
  altImage: null,
  _resourceName: 'podcast',
  _system: 'coreDam',
})

const PAGES = [
  { path: '/podcasts', name: '/(coreDam)/podcasts' },
  { path: '/podcasts/:id', name: '/(coreDam)/podcasts/[id]' },
]

const settled = () => vi.advanceTimersByTimeAsync(100)

const openEdit = async () => {
  const ui = await startUploadUi({ server, grants: ['dam_podcast_read', 'dam_podcast_update'] })
  const { defineComponent, h } = await import('vue')
  const { RouterView } = await import('vue-router')
  const PodcastEditView = (await import('@/domains/coreDam/podcast/components/PodcastEditView.vue')).default
  PAGES.forEach((route) => ui.router.addRoute({ ...route, component: { render: () => null } }))
  // Drawn by the router, because the page asks the router before it is left.
  ui.router.addRoute({ path: '/podcasts/:id/edit', name: '/(coreDam)/podcasts/[id]/edit', component: PodcastEditView })
  await ui.router.push('/podcasts/' + PODCAST + '/edit')
  const page = await ui.mount(async () => ({
    default: defineComponent({ setup: () => () => [h(ui.library.AActionbarTarget), h(RouterView)] }),
  }))
  await eventually(() =>
    expect(page.querySelector<HTMLInputElement>('[data-cy="podcast-title"] input')?.value).toBe('QA podcast')
  )
  const orders = () =>
    Array.from(page.querySelectorAll<HTMLElement>('[data-cy="podcast-web-order-number"]')).map((field) =>
      field.querySelector('input')!
    )
  const sent = () =>
    server.sent('PUT', ONE).map((request) => JSON.parse(request.data as string) as ReturnType<typeof record>)
  const dialog = () =>
    Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find((open) =>
      open.textContent?.includes('podcast export data')
    )

  const { usePodcastOneStore } = await import('@/domains/coreDam/podcast/store/podcastStore')

  return {
    ...ui,
    page,
    orders,
    sent,
    dialog,
    rows: () => usePodcastOneStore().podcast.exportData,
    title: () => page.querySelector<HTMLInputElement>('[data-cy="podcast-title"] input')!,
    typeInto: async (input: HTMLInputElement, value: string) => {
      input.value = value
      input.dispatchEvent(new Event('input'))
      await nextTick()
    },
    errorsOf: (input: HTMLInputElement) =>
      input.closest('.v-input')?.querySelector('.v-messages')?.textContent?.trim() ?? '',
    rowErrors: () =>
      Array.from(page.querySelectorAll('[data-cy="export-data-row-error"]')).map((line) => line.textContent?.trim()),
    save: async () => {
      buttonsNamed(document.body, 'Save')[0].click()
      await settled()
    },
    addExportData: async () => {
      page.querySelector<HTMLButtonElement>('[data-cy="button-add-export-data"]')!.click()
      await settled()
      await eventually(() => expect(dialog()).toBeTruthy())
    },
    confirmDialog: async () => {
      buttonsNamed(dialog()!, 'Create')[0].click()
      await settled()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  exportData = []
  server.on('GET', ONE, () => ({ status: 200, data: record() }))
  server.on('PUT', ONE, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the orders of a podcast', () => {
  it('are required, so an emptied one is not saved as 0', async () => {
    const edit = await openEdit()
    const [web] = edit.orders()

    await edit.typeInto(web, '')
    await edit.save()

    expect(edit.sent()).toEqual([])
    expect(edit.errorsOf(web)).not.toBe('')
  })

  it('are not negative, which the server failed on', async () => {
    const edit = await openEdit()
    const [, mobile] = edit.orders()

    await edit.typeInto(mobile, '-5')
    await edit.save()

    expect(edit.sent()).toEqual([])
    expect(edit.errorsOf(mobile)).not.toBe('')
  })

  it('are sent as numbers', async () => {
    const edit = await openEdit()
    const [web, mobile] = edit.orders()

    await edit.typeInto(web, '12')
    await edit.typeInto(mobile, '0')
    await edit.save()

    await eventually(() => expect(edit.sent()).toHaveLength(1))
    expect([edit.sent()[0].attributes.webOrderPosition, edit.sent()[0].attributes.mobileOrderPosition]).toEqual([12, 0])
  })
})

describe('the export data of a podcast', () => {
  it('offers a new row the first pair no row has yet', async () => {
    exportData = [exportRow(1, 'web', 'all'), exportRow(2, 'web', 'ios')]
    const edit = await openEdit()

    await edit.addExportData()

    expect(edit.rows().map((row) => [row.exportType, row.deviceType])).toEqual([
      ['web', 'all'],
      ['web', 'ios'],
      ['web', 'android'],
    ])
  })

  it('refuses in the dialog a new row whose pair another row has', async () => {
    exportData = [exportRow(1, 'web', 'all')]
    const edit = await openEdit()
    await edit.addExportData()
    // As if the pair was picked in the dialog.
    edit.rows()[1].deviceType = 'all'
    await nextTick()

    await edit.confirmDialog()

    expect({ dialogOpen: !!edit.dialog(), saysTaken: !!edit.dialog()?.textContent?.includes(TAKEN) }).toEqual({
      dialogOpen: true,
      saysTaken: true,
    })
  })

  // The dialog changes its row in place, so a row can keep a taken pair after the dialog was closed.
  it('refuses the save of two rows with one pair, says so at both, and sends nothing', async () => {
    exportData = [exportRow(1, 'web', 'all'), exportRow(2, 'mobile', 'all')]
    const edit = await openEdit()
    edit.rows()[1].exportType = 'web'
    await nextTick()

    await edit.save()

    expect([edit.sent(), edit.rowErrors()]).toEqual([[], [TAKEN, TAKEN]])
  })

  it('says at the row which pair the server refused as not unique, until the row changes', async () => {
    exportData = [exportRow(1, 'web', 'all'), exportRow(2, 'mobile', 'all')]
    server.on('PUT', ONE, () => {
      throw httpError(422, {
        error: 'validation_failed',
        fields: { 'exportData[1].exportType': ['error_field_not_unique'] },
      })
    })
    const edit = await openEdit()
    const rows = edit.rows()
    // Both pairs swapped: no two rows share a pair, but the server compares each with the saved ones.
    rows[0].exportType = 'mobile'
    rows[1].exportType = 'web'
    await nextTick()

    await edit.save()

    await eventually(() => expect(edit.sent()).toHaveLength(1))
    await eventually(() => expect(edit.rowErrors()).toHaveLength(1))
    expect(edit.rowErrors()[0]).toContain(REFUSED)

    rows[1].deviceType = 'ios'
    await nextTick()

    expect(edit.rowErrors()).toEqual([])
  })

  /*
   * The pair is taken in the database by the row it is refused for, until the other row's change is saved.
   * The message said to save that other row first, which the mark itself blocked. It names the way that works.
   */
  it('says how to get past a refused pair, and that way saves', async () => {
    exportData = [exportRow(1, 'web', 'all'), exportRow(2, 'mobile', 'all')]
    let refuse = true
    server.on('PUT', ONE, (request) => {
      if (refuse) {
        throw httpError(422, {
          error: 'validation_failed',
          fields: { 'exportData[1].exportType': ['error_field_not_unique'] },
        })
      }

      return { status: 200, data: JSON.parse(request.data as string) }
    })
    const edit = await openEdit()
    const rows = edit.rows()
    rows[0].deviceType = 'ios'
    rows[1].exportType = 'web'
    await nextTick()
    await edit.save()
    await eventually(() => expect(edit.rowErrors()).toHaveLength(1))

    expect(edit.rowErrors()[0]).toContain(GET_PAST_REFUSED)

    refuse = false
    rows[1].exportType = 'mobile'
    await nextTick()
    await edit.save()
    await eventually(() => expect(edit.sent()).toHaveLength(2))
    edit.rows()[1].exportType = 'web'
    await nextTick()
    await edit.save()

    await eventually(() => expect(edit.sent()).toHaveLength(3))
    expect(edit.sent().map((sent) => sent.exportData.map((row) => row.exportType + '/' + row.deviceType))).toEqual([
      ['web/ios', 'web/all'],
      ['web/ios', 'mobile/all'],
      ['web/ios', 'web/all'],
    ])
  })

  /*
   * The dialog of a row stays mounted once closed, with the row it edited. After the save the server's row took
   * that row's place with its real id and the same pair, and the closed dialog counted the pair as taken.
   * Every later save was refused with "fix the errors", and no field showed one.
   */
  it('saves again after a save that created a row', async () => {
    let created = 400
    server.on('PUT', ONE, (request) => {
      const body = JSON.parse(request.data as string) as ReturnType<typeof record>
      body.exportData = body.exportData.map((row) => (row.id === 0 ? { ...row, id: created++ } : row))

      return { status: 200, data: body }
    })
    const edit = await openEdit()
    await edit.addExportData()
    await edit.confirmDialog()
    await edit.save()
    await eventually(() => expect(edit.rows().map((row) => row.id)).toEqual([400]))

    await edit.typeInto(edit.title(), 'QA podcast renamed')
    await edit.save()

    await eventually(() => expect(edit.sent()).toHaveLength(2))
    expect(edit.sent()[1].texts.title).toBe('QA podcast renamed')
    expect(edit.alerts()).not.toContain(FIX_FIRST)
  })
})

/*
 * The public export holds at most one row per device type, so the order of the rows means nothing.
 * The admin offered to reorder them, and a reorder was saved with "Record was updated" and lost.
 */
describe('the order of the export data of a podcast', () => {
  it('is not offered for change', async () => {
    exportData = [exportRow(2, 'mobile', 'all'), exportRow(1, 'web', 'all')]
    const edit = await openEdit()

    expect(buttonsNamed(edit.page, 'Reorder')).toEqual([])
  })

  it('is not sent, and the rows keep the order the server gave', async () => {
    exportData = [exportRow(2, 'mobile', 'all'), exportRow(1, 'web', 'all')]
    const edit = await openEdit()
    await edit.addExportData()
    await edit.confirmDialog()

    await edit.save()

    await eventually(() => expect(edit.sent()).toHaveLength(1))
    expect(
      edit.sent()[0].exportData.map((row: Record<string, unknown>) => [row.id, row.exportType, 'position' in row])
    ).toEqual([
      [2, 'mobile', false],
      [1, 'web', false],
      [0, 'web', false],
    ])
  })
})
