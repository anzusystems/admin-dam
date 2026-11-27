import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The asset page and the asset-of-a-file page are the detail itself, opened by address. A reload of a detail opened
 * over the list lands on the asset page too, because the detail writes its address. Metadata typed into the page
 * and not saved is lost with it: the page asks before it is left, and the browser asks before a reload or close.
 * A user who may not update assets sees the metadata read-only and is never asked.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const TYPED = 'typed and not saved'

const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const LIST = '/assets'
const SETTINGS = '/settings'

const onServer = () => ({
  ...assetDetail(ASSET, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    texts: { displayTitle: 'The asset' },
    mainFile: {
      ...assetFile(FILE, 'processed', { asset: ASSET }),
      _resourceName: 'imageFile',
      imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
    },
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

const PAGE_OF_ASSET = {
  name: '/(coreDam)/assets/[id]',
  path: '/assets/:id',
  load: () => import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue'),
  address: '/assets/' + ASSET,
}
const PAGE_OF_FILE = {
  name: '/(coreDam)/assets/file/[id]',
  path: '/assets/file/:id',
  load: () => import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue'),
  address: '/assets/file/' + FILE,
}

const openPage = async (opened: typeof PAGE_OF_ASSET, grants = ['dam_asset_update']) => {
  const ui = await startUploadUi({ server, grants, customForm: { image: [customField('title')] } })
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
  ui.router.addRoute({ path: opened.path, name: opened.name, component: (await opened.load()).default as never })
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: SETTINGS, component: { render: () => null } })
  await ui.router.push(opened.address)
  const page = await ui.mount(async () => ({ default: RouterView }))
  await eventually(() => expect(page.querySelector('.dam-image-detail')).not.toBeNull())
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

  return {
    ui,
    page,
    store: useAssetDetailStore(),
    at: () => ui.router.currentRoute.value.path,
    title: () => page.querySelector<HTMLTextAreaElement>('textarea'),
    typeTitle: async () => {
      const field = page.querySelector<HTMLTextAreaElement>('textarea')!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()
    },
    close: async () => {
      page.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
      await settled()
    },
    goTo: async (address: string) => {
      // Not awaited before the clock moves: the question holds the navigation until it is answered.
      void ui.router.push(address)
      await settled()
    },
  }
}

const answer = async (name: typeof STAY | typeof LEAVE) => {
  buttonsNamed(questions()[0], name)[0].click()
  await settled()
}

beforeEach(() => {
  server = createFakeDam()
  server.assetBy(ASSET, onServer)
  server.on('GET', BY_FILE, () => ({ status: 200, data: structuredClone(onServer()) }))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  stopUploadUi()
})

describe('the asset page, with metadata typed and not saved', () => {
  it('lets the browser ask before a reload or a closed window, and not before anything is typed', async () => {
    const page = await openPage(PAGE_OF_ASSET)
    await eventually(() => expect(page.title()).not.toBeNull())
    expect(windowAsksBeforeItGoes()).toBe(false)

    await page.typeTitle()

    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  // The close button used to close the detail first, so nothing was left to ask about, and the list dropped the input.
  it('asks on the close button, and "Stay" keeps the page with what was typed', async () => {
    const page = await openPage(PAGE_OF_ASSET)
    await eventually(() => expect(page.title()).not.toBeNull())
    await page.typeTitle()

    await page.close()
    expect(questions()).toHaveLength(1)

    await answer(STAY)

    expect([page.at(), questions().length, page.title()?.value, page.store.detail]).toEqual([
      '/assets/' + ASSET,
      0,
      TYPED,
      true,
    ])
    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  it('goes to the list on the close button after "Leave anyway"', async () => {
    const page = await openPage(PAGE_OF_ASSET)
    await eventually(() => expect(page.title()).not.toBeNull())
    await page.typeTitle()

    await page.close()
    await answer(LEAVE)

    expect([page.at(), questions().length, page.store.detail]).toEqual([LIST, 0, false])
  })

  it('asks before another page opens, as the list does', async () => {
    const page = await openPage(PAGE_OF_ASSET)
    await eventually(() => expect(page.title()).not.toBeNull())
    await page.typeTitle()

    await page.goTo(SETTINGS)
    expect([page.at(), questions().length]).toEqual(['/assets/' + ASSET, 1])

    await answer(LEAVE)

    expect(page.at()).toBe(SETTINGS)
  })

  it('goes to the list on the close button without asking when nothing was typed', async () => {
    const page = await openPage(PAGE_OF_ASSET)
    await eventually(() => expect(page.title()).not.toBeNull())

    await page.close()

    expect([page.at(), questions().length]).toEqual([LIST, 0])
  })
})

describe('the page of the asset of a file, with metadata typed and not saved', () => {
  it('lets the browser ask before a reload and asks before another page opens', async () => {
    const page = await openPage(PAGE_OF_FILE)
    await eventually(() => expect(page.title()).not.toBeNull())
    await page.typeTitle()

    expect(windowAsksBeforeItGoes()).toBe(true)

    await page.goTo(SETTINGS)
    expect(questions()).toHaveLength(1)
    await answer(STAY)

    expect([page.at(), page.title()?.value]).toEqual(['/assets/file/' + FILE, TYPED])
  })
})

describe('the asset page of a user who may not update assets', () => {
  // The fields used to be editable. Whatever was typed made the page ask about changes that could never be saved.
  it('shows the metadata read-only, with no switch to flip, and never asks before leaving', async () => {
    const page = await openPage(PAGE_OF_ASSET, ['dam_asset_read'])
    await eventually(() => expect(page.page.textContent).toContain('Asset ID'))

    expect([
      page.title(),
      page.page.querySelectorAll('.v-switch').length,
      buttonsNamed(page.page, 'Save'),
      page.page.textContent?.includes('from the server'),
    ]).toEqual([null, 0, [], true])
    expect(windowAsksBeforeItGoes()).toBe(false)

    await page.close()

    expect([page.at(), questions().length]).toEqual([LIST, 0])
  })
})
