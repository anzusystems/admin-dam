import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/* The detail of an asset the store holds as being deleted - deleted by the bin of a row of the mass-edit queue, by the
 * detail itself, or so on the server already - offers neither "Save" nor "Delete" of it, as the panel beside the list
 * offers no "Save", and what was typed into it is not asked about on the way to another asset. "Delete" of the detail
 * sends one delete of its asset at a time. The real page of the list with its panel, its detail and the mass-edit
 * queue, the real page of an asset, and the application around them as it starts; the server is a fake, and so is the
 * address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/

const LIST = '/assets'
const TYPED = 'typed and not saved'
const DELETE = 'Delete'
const BEING_DELETED = 'Asset will be removed soon'
const UNSAVED = 'Unsaved changes'

/** The three assets of the list. */
const ASSETS = [
  '11111111-2222-4333-8444-555555555555',
  '22222222-2222-4333-8444-555555555555',
  '33333333-2222-4333-8444-555555555555',
]

/** The main file of the asset. */
const fileOf = (assetId: string) => 'f' + assetId.slice(1)

/** The asset the server holds as being deleted, in the cases that have one. */
let deletingOnServer: string | null = null

/** An asset the server has: a processed image, described. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'image', assetStatus: id === deletingOnServer ? 'deleting' : 'with_file' },
    licence: 1,
    flags: { described: true, visible: true },
    mainFile: assetFile(fileOf(id), 'processed', { asset: id }),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The delete of an asset is held from now on: answered by what this gives back. */
const holdDelete = () => {
  let answer: () => void = () => undefined
  server.on(
    'DELETE',
    DELETE_ASSET,
    () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve({ status: 204 })))
  )

  return async () => {
    answer()
    await settled()
  }
}

/** The detail open over the list, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
/** The mass-edit queue drawn over the whole page, or null while it is not, and its rows. */
const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
const rows = () => Array.from(queue()?.querySelectorAll<HTMLElement>('.dam-upload-queue__item') ?? [])

/** What the form drawn in the element shows: whether it says its asset is being deleted, and whether its "Save" and
 * its "Delete" are disabled. */
const shows = (form: HTMLElement) => ({
  beingDeleted: !!form.textContent?.includes(BEING_DELETED),
  saveDisabled: buttonsNamed(form, 'Save')[0]?.disabled,
  deleteDisabled: buttonsNamed(form, DELETE)[0]?.disabled,
})
const OFFERS_BOTH = { beingDeleted: false, saveDisabled: false, deleteDisabled: false }
const OFFERS_NEITHER = { beingDeleted: true, saveDisabled: true, deleteDisabled: true }

/** Whether the page asks about the unsaved metadata. */
const asks = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).some((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

/** Something typed into the title of the form drawn in the element. */
const typeInto = async (form: HTMLElement) => {
  const title = form.querySelector<HTMLTextAreaElement>('textarea')!
  title.value = TYPED
  title.dispatchEvent(new Event('input'))
  await nextTick()
}

/** The tab of the open detail with the data-cy, opened. */
const openTab = async (dataCy: string) => {
  detail()!.querySelector<HTMLElement>(`[data-cy="${dataCy}"]`)!.click()
  await settled()
}

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    customForm: { image: [customField('title')] },
  })
  // The user as the bar of the page draws them.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))

  return ui
}

/** The page of a detail, as the router draws it at the address, its form drawn. */
const openPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await start()
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))
  await eventually(() => expect(page.querySelector('textarea')).toBeTruthy())

  return { ui, page }
}

/** The page of the list with its three assets. */
const openList = async () => {
  const ui = await start()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))

  return {
    ...ui,
    tiles,
    /** The detail of the asset of the tile, opened by its pencil and drawn. */
    openDetail: async (index: number) => {
      tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())
    },
    /** "Delete" of the Info tab of the open detail, pressed and its question answered. */
    pressDelete: async () => {
      buttonsNamed(detail()!, DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    },
    /** The arrow of the open detail to the next asset, pressed. */
    toNext: async () => {
      detail()!.querySelector('.mdi-chevron-right')!.closest('button')!.click()
      await settled()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  deletingOnServer = null
  for (const id of ASSETS) server.assetBy(id, () => onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: ASSETS.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', /^\/adm\/v1\/asset-slot\/asset\/[^/]+$/, () => ({ status: 200, data: { data: [], totalCount: 0 } }))
  // The asset of a file, as the page of the asset of a file reads it.
  server.on('GET', /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/, (_request, match) => ({
    status: 200,
    data: onServer(ASSETS.find((id) => fileOf(id) === match[1])!),
  }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* The panel beside the list offered no "Save" of an asset being deleted, and the detail did: "Save" sent metadata to an
 * asset that was going, and "Delete" deleted it once more. */
describe('the detail of an asset being deleted', () => {
  it('offers neither "Save" nor "Delete" once "Edit more" opens it over an asset a queue row deleted, and asks nothing on the way on', async () => {
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    const list = await openList()
    // The second asset in the panel, typed into, and picked for the mass edit.
    list.tiles()[1].click()
    await eventually(() => expect(panel().querySelector('textarea')).not.toBeNull())
    await typeInto(panel())
    list.tiles()[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[0].click()
    await settled()
    buttonsNamed(document.body, 'Edit')[0].click()
    await eventually(() => expect(rows()).toHaveLength(1))
    // Its row deleted by its bin, and the queue put away.
    buttonsNamed(rows()[0], DELETE)[0].click()
    await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
    dialogButton(DELETE)!.click()
    await eventually(() => expect(rows()).toHaveLength(0))
    queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()
    await eventually(() => expect(queue()).toBeNull())

    buttonsNamed(panel(), 'Edit more')[0].click()
    await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())
    expect(shows(detail()!)).toEqual(OFFERS_NEITHER)

    await list.toNext()
    await eventually(() => expect(server.assetReads(ASSETS[2])).toBe(1))
    await settled()
    expect([asks(), shows(detail()!)]).toEqual([false, OFFERS_BOTH])
  })

  /* The part of the detail that deleted went with its tab: the dialog closes over the asset being deleted all the same,
   * and the panel beside the list holds it. */
  it('closes once its own delete was answered while another tab was open, and asks nothing on the way on', async () => {
    const list = await openList()
    await list.openDetail(0)
    await typeInto(detail()!)
    const deleted = holdDelete()
    await list.pressDelete()
    await openTab('button-slots')
    await deleted()

    await eventually(() => expect(detail()).toBeNull())
    expect([shows(panel()).beingDeleted, shows(panel()).saveDisabled]).toEqual([true, true])

    list.tiles()[1].click()
    await eventually(() => expect(server.assetReads(ASSETS[1])).toBe(1))
    await settled()
    expect([asks(), shows(panel()).beingDeleted, shows(panel()).saveDisabled]).toEqual([false, false, false])
  })

  it.each<[string, () => Promise<HTMLElement>]>([
    [
      'the detail of the list',
      async () => {
        const list = await openList()
        await list.openDetail(0)

        return detail()!
      },
    ],
    [
      'the page of the asset',
      async () => {
        const ui = await start()
        const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
        ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
        await ui.router.push('/assets/' + ASSETS[0])
        const page = await ui.mount(async () => ({ default: RouterView }))
        await eventually(() => expect(page.querySelector('textarea')).toBeTruthy())

        return page
      },
    ],
  ])(
    'offers neither "Save" nor "Delete" of an asset the server holds as being deleted, in %s',
    async (_where, open) => {
      deletingOnServer = ASSETS[0]

      const form = await open()

      expect(shows(form)).toEqual(OFFERS_NEITHER)
    }
  )
})

/* The two pages of a detail marked nothing of an asset deleted in the detail: with another tab opened before the delete
 * was answered, the Info tab drawn again offered "Save" and "Delete" of it, and "Delete" sent a second delete. Both say,
 * too, that the asset went meanwhile. */
describe('the page of a detail, once its delete was answered while another tab was open', () => {
  it.each<[string, string, string, () => Promise<{ default: unknown }>, string]>([
    [
      'the page of the asset',
      '/(coreDam)/assets/[id]',
      '/assets/:id',
      () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
      '/assets/' + ASSETS[0],
    ],
    [
      'the page of the asset of a file',
      '/(coreDam)/assets/file/[id]',
      '/assets/file/:id',
      () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
      '/assets/file/' + fileOf(ASSETS[0]),
    ],
  ])('offers neither "Save" nor "Delete" on %s, and has sent one delete', async (_where, name, path, load, address) => {
    const { ui, page } = await openPage(name, path, load, address)
    const deleted = holdDelete()
    buttonsNamed(page, DELETE)[0].click()
    await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
    dialogButton(DELETE)!.click()
    await settled()
    page.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    await settled()

    await deleted()
    page.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(page.querySelector('textarea')).toBeTruthy())

    expect([shows(page), server.sent('DELETE').length, ui.alerts().length]).toEqual([OFFERS_NEITHER, 1, 2])
  })
})

/* A second press of "Delete" while the delete of the detail was on its way sent a second delete, also from the Info tab
 * drawn anew after another tab. */
describe('"Delete" of the detail', () => {
  it('offers no second delete while its delete is on its way, also once another tab and the Info tab again were opened', async () => {
    const list = await openList()
    await list.openDetail(0)
    const deleted = holdDelete()

    await list.pressDelete()
    expect(buttonsNamed(detail()!, DELETE)[0].disabled).toBe(true)
    await openTab('button-slots')
    await openTab('button-meta')
    await eventually(() => expect(detail()?.querySelector('textarea')).toBeTruthy())
    expect(buttonsNamed(detail()!, DELETE)[0].disabled).toBe(true)
    await deleted()

    expect([server.sent('DELETE').length, list.alerts().length]).toEqual([1, 1])
  })

  // The guard: a delete that failed leaves "Delete" as it was.
  it('works again once its delete has failed', async () => {
    server.on('DELETE', DELETE_ASSET, () => {
      throw httpError(500)
    })
    const list = await openList()
    await list.openDetail(0)

    await list.pressDelete()
    await eventually(() => expect(list.alerts()).toHaveLength(1))

    expect(shows(detail()!)).toEqual(OFFERS_BOTH)
  })
})
