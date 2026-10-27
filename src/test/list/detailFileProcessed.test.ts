import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A detail or the panel beside the list can open while the server still processes
 * the main file, e.g. from the pencil of an upload queue row during a long upload.
 * "Save" of an undescribed asset is held back then, because the server
 * may still fill in metadata and an older form would overwrite it.
 * The app learns the file is processed from a notification and
 * from the upload queue reads, and the detail then updates.
 * Real pages, notification listener and app startup are used. The server,
 * the notification connection and the new-version address are fakes.
 */

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
const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/

const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const STILL_PROCESSED = 'The file is still being processed.'
const PROCESSED_OPEN_AGAIN = 'The file is processed. Saving becomes possible after the detail is opened again.'

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
const FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const IN_SLOT = 'bbbbbbbb-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'

type FileStatus = 'stored' | 'processed'

let fileIs: Record<string, FileStatus> = {}
let published = new Set<string>()

const fileOnServer = (fileId: string, assetId = ASSET) => ({
  ...assetFile(fileId, fileIs[fileId] ?? 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: published.has(fileId) ? { id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId } : null,
})

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

const slotsOnServer = () => {
  const data = Object.entries({ default: FILE, extra: IN_SLOT }).map(([slotName, fileId]) => ({
    id: 'slot-' + slotName,
    slotName,
    default: slotName === 'default',
    main: fileId === FILE,
    assetFile: fileOnServer(fileId),
  }))

  return { data, totalCount: data.length }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

let answerRead: () => unknown = () => onServer(ASSET)

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

const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

const processed = async (fileId = FILE, assetId = ASSET) => {
  fileIs[fileId] = 'processed'
  listeners.forEach((listener) => listener({ name: 'asset_file_processed', data: { asset: assetId, id: fileId } }))
  await settled()
}

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/**
 * Cases with a queue row: its file is with the server and its metadata can be edited.
 * A notification for the file makes the queue read the asset.
 */
let inQueue = false

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default', 'extra'] } },
    customForm: { image: [customField('title')] },
    queues: inQueue
      ? { global: [queueRow({ status: 'processing', canEditMetadata: true, assetId: ASSET, fileId: FILE })] }
      : {},
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
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })

  return ui
}

type Ui = Awaited<ReturnType<typeof start>>

type Place = () => Promise<{ ui: Ui; form: () => HTMLElement | null }>

const listOpened = async () => {
  const ui = await start()
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))

  return { ui, tiles }
}

const inTheDetailOfTheList: Place = async () => {
  const { ui, tiles } = await listOpened()
  tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()

  return { ui, form: dialogOfList }
}

const inThePanelBesideTheList: Place = async () => {
  const { ui, tiles } = await listOpened()
  tiles()[0].click()

  return { ui, form: panel }
}

const inTheDetailOfTheQueueRow: Place = async () => {
  const { ui } = await listOpened()
  document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
  const edit = await eventually(() => {
    const queue = document.body.querySelector('.overlay--sidebar')
    expect(queue).not.toBeNull()

    return buttonsNamed(queue!, 'Edit more')[0]
  })
  edit.click()

  return { ui, form: dialogOfList }
}

const onPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await start()
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))

  return { ui, form: () => page }
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
    '/assets/file/' + FILE
  )

const ofTheList: Array<[string, Place]> = [
  ['the detail of the asset', inTheDetailOfTheList],
  ['the panel beside the list', inThePanelBesideTheList],
]

const openForm = async (place: Place) => {
  const { ui, form } = await place()
  const title = () => form()?.querySelector<HTMLTextAreaElement>('textarea') ?? null
  await eventually(() => expect(title()).not.toBeNull())

  return {
    ui,
    title,
    typeTitle: async () => {
      const field = title()!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()

      return field
    },
    save: () => ({
      heldBack: buttonsNamed(form()!, 'Save')[0]?.disabled,
      saysWhy: [STILL_PROCESSED, PROCESSED_OPEN_AGAIN].some((line) => form()!.textContent?.includes(line)),
    }),
    cardOffers: async () => {
      const button = form()!.querySelector('.mdi-dots-vertical')?.closest('button')
      if (!button) return null
      button.click()
      await eventually(() => expect(menu()).not.toBeNull())
      const items = Array.from(menu()!.querySelectorAll<HTMLElement>('.v-list-item')).map((item) =>
        item.textContent?.trim()
      )
      button.click()
      await eventually(() => expect(menu()).toBeNull())

      return items
    },
  }
}

const HELD_BACK = { heldBack: true, saysWhy: true }
const FREE = { heldBack: false, saysWhy: false }

beforeEach(() => {
  listeners.length = 0
  server = createFakeDam()
  inQueue = false
  fileIs = { [FILE]: 'stored', [IN_SLOT]: 'processed' }
  published = new Set()
  answerRead = () => onServer(ASSET)
  server.assetBy(ASSET, () => answerRead())
  server.assetBy(OTHER, () => onServer(OTHER))
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', BY_FILE, async () => ({ status: 200, data: structuredClone(await answerRead()) }))
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
  for (const fileId of [FILE, IN_SLOT]) server.fileBy('image', fileId, () => fileOnServer(fileId))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/*
 * Nothing told the open detail that the file was processed. "Save" stayed held back, with
 * the text saying the file is still being processed, until the asset was opened again.
 */
describe('a form opened while the main file of its asset was being processed, once the server says it is processed', () => {
  it.each(ofTheList)('is read anew in %s while nothing was typed into it: "Save" comes free', async (_where, place) => {
    const form = await openForm(place)
    expect([form.save(), await form.cardOffers(), reads()]).toEqual([HELD_BACK, null, 1])

    await processed()
    await eventually(() => expect(form.save()).toEqual(FREE))

    expect([reads(), form.title()?.value, await form.cardOffers(), form.ui.alerts()]).toEqual([
      2,
      FROM_SERVER,
      ['Make public'],
      [],
    ])
  })

  /*
   * The form was read before the server finished the file and may be older
   * than the metadata the server filled in since, so "Save" stays held back.
   * The data held for the file is still brought up to date.
   */
  it.each(ofTheList)(
    'keeps what was typed into it in %s, and "Save" held back: only its file is as the server has it',
    async (_where, place) => {
      const form = await openForm(place)
      const typedInto = await form.typeTitle()
      expect([form.save(), await form.cardOffers()]).toEqual([HELD_BACK, null])

      await processed()
      await eventually(() => expect(reads()).toBe(2))
      await settled()

      expect([form.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
      expect([form.save(), await form.cardOffers(), form.ui.alerts()]).toEqual([HELD_BACK, ['Make public'], []])
    }
  )

  it.each<[string, Place]>([
    ['the page of an asset', onThePageOfTheAsset],
    ['the page of the asset of a file', onThePageOfTheFile],
  ])('is read anew on %s', async (_where, place) => {
    const form = await openForm(place)
    expect([form.save(), reads()]).toEqual([HELD_BACK, 1])

    await processed()
    await eventually(() => expect(form.save()).toEqual(FREE))

    expect([reads(), form.title()?.value, form.ui.alerts()]).toEqual([2, FROM_SERVER, []])
  })

  /*
   * Without a notification the upload queue learns this from a
   * read of the asset: its poll or the refresh button of the row.
   * The detail is the one opened by the pencil of the row.
   */
  it('is read anew in the detail of a row of the upload queue, once the queue has read the asset as processed', async () => {
    inQueue = true
    const form = await openForm(inTheDetailOfTheQueueRow)
    expect([form.save(), reads()]).toEqual([HELD_BACK, 1])

    fileIs[FILE] = 'processed'
    await form.ui.store.refreshQueueItem(form.ui.rows.global[0])
    await eventually(() => expect(form.save()).toEqual(FREE))

    expect([reads(), form.ui.rows.global[0].status, form.ui.alerts()]).toEqual([3, 'uploaded', []])
  })

  /*
   * The notification can arrive while the asset is being read,
   * and that read can still return the file as not processed.
   * The asset is read once more when that read lands.
   */
  it('is read once more when the read that was on its way brought the file as not processed yet', async () => {
    const letRead = holdNextRead()
    const { ui, tiles } = await listOpened()
    tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()
    expect(reads()).toBe(1)

    await processed()
    expect(reads()).toBe(1)
    await letRead()

    await eventually(() => expect(reads()).toBe(2))
    await eventually(() => expect(buttonsNamed(dialogOfList()!, 'Save')[0]?.disabled).toBe(false))
    expect([dialogOfList()!.textContent?.includes(STILL_PROCESSED), ui.alerts()]).toEqual([false, []])
  })
})

describe('a form that has nothing to learn from a file the server has processed', () => {
  it('is not read again when the read that was on its way brought the file as processed', async () => {
    const { tiles } = await listOpened()
    const letRead = holdNextRead()
    fileIs[FILE] = 'processed'
    tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()

    await processed()
    await letRead()
    await eventually(() => expect(buttonsNamed(dialogOfList()!, 'Save')[0]?.disabled).toBe(false))
    await settled()

    expect(reads()).toBe(1)
  })

  /*
   * A file in another slot of its asset, with the asset not
   * described, is news: the server may fill in the metadata from it.
   * See `detailOtherSlotProcessed.test.ts`.
   */
  it('is not read again for the file of another asset', async () => {
    const form = await openForm(inTheDetailOfTheList)

    await processed('file-of-other', OTHER)
    await processed(FILE, OTHER)

    expect([reads(), form.save(), form.ui.alerts()]).toEqual([1, HELD_BACK, []])
  })

  it('is not read again once the page of the asset was left', async () => {
    const form = await openForm(onThePageOfTheAsset)
    // With the mounted dialogs open, a navigation waits for a timer of theirs before it continues.
    const left = form.ui.router.push('/settings')
    await settled()
    await left

    await processed()

    expect([reads(), form.ui.alerts()]).toEqual([1, []])
  })
})

/* The server makes public only a processed file. For any other file it answers with a refusal that gives no reason. */
describe('"Make public" of a file', () => {
  it('leaves a public file its menu, with its address and "Make private", while it is held as not processed', async () => {
    published = new Set([FILE])
    const form = await openForm(inTheDetailOfTheList)

    expect(await form.cardOffers()).toEqual(['Copy URL', 'Make private'])
  })

  it('is offered in the row of a slot only for a file the server has processed, and no menu is drawn without it', async () => {
    fileIs = { [FILE]: 'processed', [IN_SLOT]: 'stored' }
    await openForm(inTheDetailOfTheList)
    dialogOfList()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    const slotRow = (name: string) =>
      Array.from(dialogOfList()!.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8')).find((row) =>
        row.querySelector('.font-weight-bold')?.textContent?.trim().startsWith(name)
      )
    await eventually(() => expect([slotRow('default'), slotRow('extra')].every(Boolean)).toBe(true))

    const routeMenuOf = (name: string) => slotRow(name)!.querySelector('.mdi-dots-vertical')?.closest('button')
    expect([!!routeMenuOf('default'), !!routeMenuOf('extra')]).toEqual([true, false])
    routeMenuOf('default')!.click()
    await eventually(() =>
      expect(
        Array.from(menu()?.querySelectorAll('.v-list-item') ?? []).map((item) => item.textContent?.trim())
      ).toEqual(['Make public'])
    )
  })
})
