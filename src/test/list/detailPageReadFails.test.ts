import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The two pages that draw the detail of one asset - the page of an asset, the page of the asset of a file - read the
 * asset as they open, and again once its file was changed in the detail: whole while nothing typed into the form
 * waits to be saved, for its file alone while something does. A read that fails says so. The real pages, and the
 * application around them as it starts; the server is a fake, and so is the address the page asks about a new
 * version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/([^/]+)\/make-private$/

const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const PUBLIC = 'File is public'
const PRIVATE = 'File is private'

const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'

/** Whether the server holds the file of the asset as public. */
let published = true

/** The asset as the server holds it now: an image of the licence of the user. */
const onServer = () => ({
  ...assetDetail(ASSET, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    texts: { displayTitle: 'The asset' },
    mainFile: {
      ...assetFile(FILE, 'processed', { asset: ASSET }),
      _resourceName: 'imageFile',
      imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
      mainRoute: published ? { id: 'route', publicUrl: 'https://dam.test/public/' + FILE } : null,
    },
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** How a read of the asset is answered: with what the server holds, unless a case makes it fail. */
let answerRead: () => unknown = onServer
const failReads = () => {
  answerRead = () => {
    throw httpError(500)
  }
}

/** How many times the server was asked for the asset, by its own id or by the id of its file. */
const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

/** The page of a detail, as the router draws it at the address: answers the element it is drawn in. */
const openPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
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
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const title = () => page.querySelector<HTMLTextAreaElement>('textarea')

  return {
    ui,
    title,
    /** What the page draws of the asset: its name in the bar, the route of its file, and whether "Save" is there. */
    drawn: () => ({
      name: page.querySelector('.v-toolbar .text-label-large')?.textContent?.trim() ?? null,
      route:
        Array.from(page.querySelectorAll('.v-chip'))
          .map((chip) => chip.textContent?.trim())
          .find((text) => text === PUBLIC || text === PRIVATE) ?? null,
      save: buttonsNamed(page, 'Save').length,
    }),
    typeTitle: async () => {
      const field = title()!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()

      return field
    },
    /** "Make private" of the menu of the file card: the change goes through, and the asset is read again. */
    makePrivate: async () => {
      page.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
      const item = await eventually(() => {
        const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
          (listed) => listed.textContent?.trim() === 'Make private'
        )
        expect(found).toBeTruthy()

        return found!
      })
      item.click()
      await settled()
    },
  }
}

type Page = () => ReturnType<typeof openPage>

const pages: Array<[string, Page]> = [
  [
    'the page of an asset',
    () =>
      openPage(
        '/(coreDam)/assets/[id]',
        '/assets/:id',
        () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
        '/assets/' + ASSET
      ),
  ],
  [
    'the page of the asset of a file',
    () =>
      openPage(
        '/(coreDam)/assets/file/[id]',
        '/assets/file/:id',
        () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
        '/assets/file/' + FILE
      ),
  ],
]

const NOTHING = { name: null, route: null, save: 0 }

beforeEach(() => {
  server = createFakeDam()
  published = true
  answerRead = onServer
  server.assetBy(ASSET, () => answerRead())
  server.on('GET', BY_FILE, async () => ({ status: 200, data: structuredClone(await answerRead()) }))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('PATCH', MAKE_PRIVATE, () => {
    published = false

    return { status: 204 }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  stopUploadUi()
})

/* The page went on drawing the asset as it was before the change, under an error and a working "Save" - which would
 * have written the form of before the change over what the change did. The list closes its detail then. */
describe('a page of a detail, when the read of the asset that follows a change of its file fails', () => {
  it.each(pages)('draws the asset no more on %s, and says so once', async (_where, open) => {
    const page = await open()
    await eventually(() => expect(page.drawn()).toEqual({ name: 'The asset', route: PUBLIC, save: 1 }))
    failReads()

    await page.makePrivate()
    await eventually(() => expect(page.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([page.drawn(), reads(), server.sent('PATCH', MAKE_PRIVATE).length]).toEqual([NOTHING, 2, 1])
  })

  // The guard: what was typed is read under, with no loader, and stays when that read fails.
  it.each(pages)('keeps the form on %s with what was typed into it, and says so once', async (_where, open) => {
    const page = await open()
    await eventually(() => expect(page.drawn().save).toBe(1))
    const typedInto = await page.typeTitle()
    failReads()

    await page.makePrivate()
    await eventually(() => expect(page.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([page.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
    // The card is as old as the form: the change went through, and the read that would show it did not.
    expect([page.drawn(), reads()]).toEqual([{ name: 'The asset', route: PUBLIC, save: 1 }, 2])
  })
})

// The guard: the first read of a page has no asset to leave drawn.
describe('a page of a detail, when the read of the asset it opens with fails', () => {
  it.each(pages)('draws no asset on %s, and says so once', async (_where, open) => {
    failReads()
    const page = await open()
    await eventually(() => expect(page.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([page.drawn(), reads()]).toEqual([NOTHING, 1])
  })
})
