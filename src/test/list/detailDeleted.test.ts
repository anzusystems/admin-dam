import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/* An asset deleted in the detail over the list is marked as being deleted - its tile, and the panel beside the list
 * that holds it, which offers no "Save" of it any more. The mark is of the asset the delete was sent for, also when the
 * detail has gone on to the next asset or to another of its tabs before the delete was answered, and a read of the
 * asset asked before the delete, answered after it, does not undo the mark. The real page of the list with its detail
 * and its panel, the real listener of the notifications, and the application around them as it starts; the server is
 * a fake, and so are the connection its notifications come by and the address the page asks about a new version of
 * the application. */

let server: FakeDam
const listeners: Array<(event: { name: string; data: unknown }) => void> = []

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  initDamNotifications: () => ({ openConnection: () => undefined }),
  useDamNotifications: () => ({
    addDamNotificationListener: (listener: (event: { name: string; data: unknown }) => void) => {
      listeners.push(listener)

      return () => undefined
    },
  }),
}))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/

const LIST = '/assets'
const BEING_DELETED = 'Asset will be removed soon'
/** The asset deleted, its main file the server is processing; the asset after it in the list. */
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

/** How far the server is with the main file of the asset. */
let fileIs: 'stored' | 'processed' = 'stored'

const fileOnServer = (fileId: string, assetId: string) => ({
  ...assetFile(fileId, assetId === ASSET ? fileIs : 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

/** An asset as the server holds it now: an image of the licence of the user, not described. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    flags: { described: false, visible: true },
    mainFile: fileOnServer(id === ASSET ? FILE : 'file-of-other', id),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** How a read of the asset is answered: at once with what the server holds, unless a case holds it. */
let answerRead: () => unknown = () => onServer(ASSET)

/* The next read of the asset is held, every later one answers at once. Let go, it answers what the server held when
 * it was asked. */
const holdNextRead = () => {
  let letGo: () => void = () => undefined
  let asked = false
  answerRead = () => {
    if (asked) return onServer(ASSET)
    asked = true
    const asRead = onServer(ASSET)

    return new Promise((resolve) => (letGo = () => resolve(asRead)))
  }

  return () => {
    letGo()

    return settled()
  }
}

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

const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** "Delete" of the Info tab of the open detail, pressed and its question answered. */
const pressDelete = async () => {
  buttonsNamed(dialogOfList()!, 'Delete')[0].click()
  await eventually(() => expect(dialogButton('Delete')).not.toBeNull())
  dialogButton('Delete')!.click()
  await settled()
}

/** What the panel shows: whether it says its asset is being deleted, and whether its "Save" is disabled. */
const panelShows = () => ({
  beingDeleted: !!panel().textContent?.includes(BEING_DELETED),
  saveDisabled: buttonsNamed(panel(), 'Save')[0]?.disabled,
})

/** The page of the list with its two assets. */
const listOpened = async () => {
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
  // As the start of the application: the listener of the notifications of the server.
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))

  return {
    ...ui,
    tiles,
    /** Which tiles are drawn as of an asset being deleted. */
    deleting: () => tiles().map((tile) => !!tile.querySelector('.mdi-trash-can')),
    /** The detail of the first asset, opened by the pencil of its tile and drawn. */
    openDetail: async () => {
      tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      await eventually(() => expect(dialogOfList()?.querySelector('textarea')).toBeTruthy())
    },
  }
}

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  fileIs = 'stored'
  answerRead = () => onServer(ASSET)
  server.assetBy(ASSET, () => answerRead())
  server.assetBy(OTHER, () => onServer(OTHER))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: [onServer(ASSET), onServer(OTHER)], hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', /^\/adm\/v1\/asset-slot\/asset\/[^/]+$/, () => ({ status: 200, data: { data: [], totalCount: 0 } }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('an asset deleted in the detail over the list', () => {
  /* The delete changed the asset the panel holds in its place, and a read of it asked before - by the news of its
   * file, here - and answered after the delete put the asset back as it was: no longer being deleted, "Save" free. */
  it('stays marked as being deleted when a read of it asked before the delete is answered after it', async () => {
    const list = await listOpened()
    list.tiles()[0].click()
    await eventually(() => expect(panel().querySelector('textarea')).not.toBeNull())
    const letRead = holdNextRead()
    fileIs = 'processed'
    listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: ASSET, id: FILE } }))
    await settled()
    expect(server.assetReads(ASSET)).toBe(2)
    server.on('DELETE', DELETE_ASSET, () => ({ status: 204 }))
    buttonsNamed(panel(), 'Edit more')[0].click()
    await eventually(() => expect(dialogOfList()).not.toBeNull())

    await pressDelete()
    await eventually(() => expect(dialogOfList()).toBeNull())
    expect(panelShows()).toEqual({ beingDeleted: true, saveDisabled: true })
    await letRead()
    await settled()

    expect([list.deleting(), panelShows()]).toEqual([[true, false], { beingDeleted: true, saveDisabled: true }])
  })

  /* The mark was taken from the asset the detail held when the delete was answered: the next one, gone on to by the
   * arrow key meanwhile, was marked, and the deleted one not. */
  it('marks the asset deleted, not the next one the detail has gone on to before the delete was answered', async () => {
    const list = await listOpened()
    await list.openDetail()
    const deleted = holdDelete()
    await pressDelete()

    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    await eventually(() => expect(server.assetReads(OTHER)).toBeGreaterThan(0))
    await settled()
    await deleted()

    expect([list.deleting(), !!dialogOfList(), !!dialogOfList()?.textContent?.includes(BEING_DELETED)]).toEqual([
      [true, false],
      true,
      false,
    ])
  })

  // The part of the detail that deleted is gone with its tab: what it would have said, Vue dropped.
  it('marks the asset deleted when another tab of the detail was opened before the delete was answered', async () => {
    const list = await listOpened()
    await list.openDetail()
    const deleted = holdDelete()
    await pressDelete()

    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    await settled()
    await deleted()

    expect(list.deleting()).toEqual([true, false])
  })
})
