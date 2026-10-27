import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The Info tab file card shows the main file: which file it is and whether it is public.
 * Both change from the detail. The route changes from the card
 * and from the Slots row, the main file from the Slots tab.
 * The asset is then re-read: whole when nothing typed waits to be saved, otherwise only for what changed.
 * The detail is drawn in the list dialog, on the asset page and on the asset-of-a-file page.
 * Real pages and app startup are used. The server and the new-version address are fakes.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/
const MAKE_PRIVATE = /^\/adm\/v1\/document\/([^/]+)\/make-private$/
const MAIN = /^\/adm\/v1\/document\/([^/]+)\/asset\/([^/]+)\/main$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const PUBLIC = 'File is public'
const PRIVATE = 'File is private'

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
const FIRST = 'aaaaaaaa-2222-4333-8444-555555555555'
const SECOND = 'bbbbbbbb-2222-4333-8444-555555555555'
const MIME: Record<string, string> = { [FIRST]: 'application/pdf', [SECOND]: 'text/plain' }

let main = FIRST
let published = new Set<string>()
let named = 'The asset'

const routeOf = (fileId: string) => ({ id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId })

const fileOnServer = (fileId: string) => ({
  ...assetFile(fileId, 'processed', {
    asset: ASSET,
    fileAttributes: {
      status: 'processed',
      failReason: 'none',
      originFileName: fileId,
      mimeType: MIME[fileId],
      size: 1,
    },
  }),
  mainRoute: published.has(fileId) ? routeOf(fileId) : null,
})

const onServer = () => ({
  ...assetDetail(ASSET, {
    attributes: { assetType: 'document', assetStatus: 'with_file' },
    licence: 1,
    texts: { displayTitle: named },
    mainFile: fileOnServer(main),
  }),
  keywords: [],
  authors: [],
})

const slotsOnServer = () => {
  const data = Object.entries({ default: FIRST, extra: SECOND }).map(([slotName, fileId]) => ({
    id: 'slot-' + slotName,
    slotName,
    default: slotName === 'default',
    main: fileId === main,
    assetFile: fileOnServer(fileId),
  }))

  return { data, totalCount: data.length }
}

let answerRead: () => unknown = onServer

const holdRead = () => {
  let letGo: () => void = () => undefined
  answerRead = () => new Promise((resolve) => (letGo = () => resolve(onServer())))

  return () => {
    letGo()

    return settled()
  }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_document_update'],
    extSystem: { document: { slots: ['default', 'extra'] } },
    customForm: { document: [customField('title')] },
  })
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
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })

  return ui
}

type Place = () => Promise<() => HTMLElement>

const inTheDialogOfTheList: Place = async () => {
  const ui = await start()
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(1)

    return found
  })
  tiles[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()

  return () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')!
}

const onPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await start()
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))

  return () => page
}

const onThePageOfTheAsset: Place = () =>
  onPage(
    '/(coreDam)/assets/[id]',
    '/assets/:id',
    () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
    '/assets/' + ASSET
  )

const onThePageOfTheFile: Place = () =>
  onPage(
    '/(coreDam)/assets/file/[id]',
    '/assets/file/:id',
    () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
    '/assets/file/' + SECOND
  )

const pages: Array<[string, Place]> = [
  ['the page of an asset', onThePageOfTheAsset],
  ['the page of the asset of a file', onThePageOfTheFile],
]
const places: Array<[string, Place]> = [['the dialog over the list', inTheDialogOfTheList], ...pages]

const openDetail = async (place: Place) => {
  const drawnIn = await place()
  const ids = () =>
    Array.from(drawnIn()?.querySelectorAll('.sidebar-info__content .anzu-copy-text > span') ?? []).map((id) =>
      id.textContent?.trim()
    )
  await eventually(() => expect(ids()).toEqual([ASSET, main]))
  const chips = (within: ParentNode | null | undefined) =>
    Array.from(within?.querySelectorAll('.v-chip') ?? [])
      .map((chip) => chip.textContent?.trim())
      .find((text) => text === PUBLIC || text === PRIVATE) ?? null
  const slotRow = (name: string) =>
    Array.from(drawnIn().querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8')).find((row) =>
      row.querySelector('.font-weight-bold')?.textContent?.trim().startsWith(name)
    )
  const tab = async (mark: string) => {
    drawnIn().querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
    await settled()
  }
  const pressMenuItem = async (name: string) => {
    const item = await eventually(() => {
      const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (listed) => listed.textContent?.trim() === name
      )
      expect(found).toBeTruthy()

      return found!
    })
    item.click()
    await settled()
  }

  return {
    drawnIn,
    info: () => ({
      file: ids()[1] ?? null,
      type: drawnIn()
        .querySelector('.sidebar-info__content')
        ?.textContent?.match(/application\/pdf|text\/plain/)?.[0],
      route: chips(drawnIn().querySelector('.sidebar-info__content')),
    }),
    name: () => drawnIn().querySelector('.v-toolbar .text-label-large')?.textContent?.trim() ?? '',
    title: () => drawnIn().querySelector<HTMLTextAreaElement>('.sidebar-info__content textarea'),
    typeTitle: async () => {
      const field = drawnIn().querySelector<HTMLTextAreaElement>('.sidebar-info__content textarea')!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()

      return field
    },
    save: async () => {
      drawnIn().querySelector<HTMLButtonElement>('[data-cy="button-save"]')!.click()
      await settled()

      return String(server.sent('PATCH', BULK).at(-1)?.data)
    },
    openInfo: () => tab('button-meta'),
    openSlots: async () => {
      await tab('button-slots')
      await eventually(() => expect([slotRow('default'), slotRow('extra')].every(Boolean)).toBe(true))
    },
    slot: (name: string) => ({
      main: !!slotRow(name)?.querySelector('.font-weight-bold')?.textContent?.includes('Main file'),
      route: chips(slotRow(name)),
    }),
    makePrivateInInfo: async () => {
      drawnIn().querySelector('.sidebar-info__content .mdi-dots-vertical')!.closest('button')!.click()
      await pressMenuItem('Make private')
    },
    makePrivateInSlot: async (name: string) => {
      slotRow(name)!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
      await pressMenuItem('Make private')
    },
    makeMain: async (name: string) => {
      slotRow(name)!.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
      await pressMenuItem('Make main file')
    },
    slotsTab: () => drawnIn().querySelector<HTMLElement>('[data-cy="button-slots"]'),
  }
}

let alerts: () => string[] = () => []

beforeEach(() => {
  server = createFakeDam()
  main = FIRST
  published = new Set([FIRST, SECOND])
  named = 'The asset'
  answerRead = onServer
  server.assetBy(ASSET, () => answerRead())
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', BY_FILE, async () => ({ status: 200, data: structuredClone(await answerRead()) }))
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [onServer()], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  // core-dam answers: 204 with no body for a document made private, 200 with the file for a new main file.
  server.on('PATCH', MAKE_PRIVATE, (_request, match) => {
    published.delete(match[1])

    return { status: 204 }
  })
  server.on('PATCH', MAIN, (_request, match) => {
    main = match[1]

    return { status: 200, data: fileOnServer(match[1]) }
  })
  alerts = () =>
    Array.from(document.body.querySelectorAll('.a-alerts .v-alert')).map((alert) => alert.textContent?.trim() ?? '')
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the file card of the Info tab, when the file is made private from it on a page of a detail', () => {
  /*
   * Regression: the pages re-read the asset whole after the change,
   * whatever the form held, and typed text was lost without a question.
   * The list dialog kept it, since it takes only the route (`mainRouteChange.test.ts`).
   */
  it.each(pages)(
    'keeps metadata typed into %s and not saved: only the route of the file is taken',
    async (_where, place) => {
      const detail = await openDetail(place)
      const typedInto = await detail.typeTitle()
      const answer = holdRead()
      named = 'renamed meanwhile'

      await detail.makePrivateInInfo()

      expect([reads(), detail.title() === typedInto, typedInto.isConnected, detail.info().route]).toEqual([
        2,
        true,
        true,
        PUBLIC,
      ])

      await answer()

      expect([detail.info(), detail.name()]).toEqual([
        { file: FIRST, type: 'application/pdf', route: PRIVATE },
        'The asset',
      ])
      expect([detail.title() === typedInto, typedInto.isConnected, typedInto.value, alerts()]).toEqual([
        true,
        true,
        TYPED,
        [],
      ])
      expect(await detail.save()).toContain(TYPED)
      expect(alerts()).toEqual([UPDATED])
    }
  )

  it.each(pages)('reads the asset whole on %s while nothing was typed, as it did', async (_where, place) => {
    const detail = await openDetail(place)
    const untouched = detail.title()
    const answer = holdRead()
    named = 'renamed meanwhile'

    await detail.makePrivateInInfo()

    expect([reads(), untouched?.isConnected, detail.title()]).toEqual([2, false, null])

    await answer()

    expect([detail.info().route, detail.name(), detail.title()?.value]).toEqual([
      PRIVATE,
      'renamed meanwhile',
      FROM_SERVER,
    ])
  })
})

/*
 * The Slots row has the same menu as the Info file card.
 * Regression: after a change it re-read only the slots, so for the main file the Info tab kept showing stale data.
 */
describe('the file card of the Info tab, when the route of the main file is changed in the Slots tab', () => {
  it.each(places)('says what the file is by then, in %s', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.openSlots()
    expect([detail.slot('default'), reads()]).toEqual([{ main: true, route: PUBLIC }, 1])
    named = 'renamed meanwhile'

    await detail.makePrivateInSlot('default')
    await eventually(() => expect(detail.slot('default')).toEqual({ main: true, route: PRIVATE }))

    expect([reads(), detail.name().endsWith('renamed meanwhile')]).toEqual([2, true])
    await detail.openInfo()
    expect([detail.info(), alerts()]).toEqual([{ file: FIRST, type: 'application/pdf', route: PRIVATE }, []])
  })

  it.each(places)('says so in %s with metadata typed and not saved, which stay', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.typeTitle()
    await detail.openSlots()
    const tabOfSlots = detail.slotsTab()
    named = 'renamed meanwhile'

    await detail.makePrivateInSlot('default')
    await eventually(() => expect(detail.slot('default')).toEqual({ main: true, route: PRIVATE }))

    expect([reads(), detail.slotsTab() === tabOfSlots, detail.name().endsWith('The asset')]).toEqual([2, true, true])
    await detail.openInfo()
    expect([detail.info(), detail.title()?.value, alerts()]).toEqual([
      { file: FIRST, type: 'application/pdf', route: PRIVATE },
      TYPED,
      [],
    ])
    expect(await detail.save()).toContain(TYPED)
  })

  it('is not read again for the route of a file that is not the main one', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()

    await detail.makePrivateInSlot('extra')
    await eventually(() => expect(detail.slot('extra')).toEqual({ main: false, route: PRIVATE }))

    expect([reads(), detail.slot('default')]).toEqual([1, { main: true, route: PUBLIC }])
    await detail.openInfo()
    expect(detail.info()).toEqual({ file: FIRST, type: 'application/pdf', route: PUBLIC })
  })
})

/*
 * Regression: "Make main file" in the Slots tab re-read only the slots.
 * The Info tab kept showing the old main file, with its route and menu.
 */
describe('the file card of the Info tab, when another file is made the main one in the Slots tab', () => {
  beforeEach(() => {
    published = new Set([FIRST])
  })

  it.each(places)('shows the new main file in %s', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.openSlots()
    named = 'renamed meanwhile'

    await detail.makeMain('extra')
    await eventually(() => expect([detail.slot('default').main, detail.slot('extra').main]).toEqual([false, true]))

    expect([reads(), detail.name().endsWith('renamed meanwhile')]).toEqual([2, true])
    await detail.openInfo()
    expect([detail.info(), alerts()]).toEqual([{ file: SECOND, type: 'text/plain', route: PRIVATE }, []])
  })

  it.each(places)('shows it in %s with metadata typed and not saved, which stay', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.typeTitle()
    await detail.openSlots()
    const tabOfSlots = detail.slotsTab()
    named = 'renamed meanwhile'

    await detail.makeMain('extra')
    await eventually(() => expect([detail.slot('default').main, detail.slot('extra').main]).toEqual([false, true]))

    expect([reads(), detail.slotsTab() === tabOfSlots, detail.name().endsWith('The asset')]).toEqual([2, true, true])
    await detail.openInfo()
    expect([detail.info(), detail.title()?.value, alerts()]).toEqual([
      { file: SECOND, type: 'text/plain', route: PRIVATE },
      TYPED,
      [],
    ])
    expect(await detail.save()).toContain(TYPED)
  })

  it('is not read again after a "Make main file" the server refused', async () => {
    server.on('PATCH', MAIN, () => {
      throw httpError(500)
    })
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()

    await detail.makeMain('extra')
    await eventually(() => expect(alerts()).toEqual([SYSTEM_ERROR]))

    expect([reads(), detail.slot('default').main, detail.slot('extra').main]).toEqual([1, true, false])
    await detail.openInfo()
    expect(detail.info()).toEqual({ file: FIRST, type: 'application/pdf', route: PUBLIC })
  })
})
