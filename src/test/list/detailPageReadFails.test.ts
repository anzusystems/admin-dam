import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The asset page and the asset-of-a-file page read the asset on open, and again after its file changes in the detail.
 * The second read is whole while nothing typed waits to be saved,
 * and for the file alone otherwise. A failed read says so.
 */

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

let published = true

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

let answerRead: () => unknown = onServer
const failReads = () => {
  answerRead = () => {
    throw httpError(500)
  }
}

const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

const openPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    customForm: { image: [customField('title')] },
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
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const title = () => page.querySelector<HTMLTextAreaElement>('textarea')

  return {
    ui,
    title,
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

/*
 * The page used to keep drawing the asset as before the change, with an error and a working "Save".
 * That "Save" would write the pre-change form over what the change did. The list closes its detail in this case.
 */
describe('a page of a detail, when the read of the asset that follows a change of its file fails', () => {
  it.each(pages)('draws the asset no more on %s, and says so once', async (_where, open) => {
    const page = await open()
    await eventually(() => expect(page.drawn()).toEqual({ name: 'The asset', route: PUBLIC, save: 1 }))
    failReads()

    await page.makePrivate()
    await eventually(() => expect(page.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([page.drawn(), reads(), server.sent('PATCH', MAKE_PRIVATE).length]).toEqual([NOTHING, 2, 1])
  })

  it.each(pages)('keeps the form on %s with what was typed into it, and says so once', async (_where, open) => {
    const page = await open()
    await eventually(() => expect(page.drawn().save).toBe(1))
    const typedInto = await page.typeTitle()
    failReads()

    await page.makePrivate()
    await eventually(() => expect(page.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([page.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
    expect([page.drawn(), reads()]).toEqual([{ name: 'The asset', route: PUBLIC, save: 1 }, 2])
  })
})

describe('a page of a detail, when the read of the asset it opens with fails', () => {
  it.each(pages)('draws no asset on %s, and says so once', async (_where, open) => {
    failReads()
    const page = await open()
    await eventually(() => expect(page.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([page.drawn(), reads()]).toEqual([NOTHING, 1])
  })
})
