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

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/([^/]+)\/make-private$/
const FILE = /^\/adm\/v1\/image\/([^/]+)$/
const DELETE_ASSET = /^\/adm\/v1\/asset\/([^/]+)$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const PUBLIC = 'File is public'
const PRIVATE = 'File is private'
const STILL_PROCESSED = 'The file is still being processed.'
const BEING_DELETED = 'Asset will be removed soon'
const DELETED_MEANWHILE = 'The asset has been deleted meanwhile.'
const DELETE = 'Delete'

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
const FIRST = 'aaaaaaaa-2222-4333-8444-555555555555'
const SECOND = 'bbbbbbbb-2222-4333-8444-555555555555'
const OTHER = '22222222-2222-4333-8444-555555555555'
const OF_OTHER = 'cccccccc-2222-4333-8444-555555555555'

let slots: Record<string, string | null> = {}
let main: string | null = FIRST
let published = new Set<string>()
let processed: Record<string, 'stored' | 'processed'> = {}
let status = 'with_file'

const routeOf = (fileId: string) => ({ id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId })

const fileOnServer = (fileId: string, assetId = ASSET) => ({
  ...assetFile(fileId, processed[fileId] ?? 'processed', { asset: assetId }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: published.has(fileId) ? routeOf(fileId) : null,
})

const onServer = () => ({
  ...assetDetail(ASSET, {
    attributes: { assetType: 'image', assetStatus: status },
    licence: 1,
    texts: { displayTitle: 'The asset' },
    flags: { described: false, visible: true },
    mainFile: main ? fileOnServer(main) : null,
  }),
  keywords: [],
  authors: [],
})

const otherOnServer = () => ({
  ...assetDetail(OTHER, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    texts: { displayTitle: 'Another asset' },
    flags: { described: true, visible: true },
    mainFile: fileOnServer(OF_OTHER, OTHER),
  }),
  keywords: [],
  authors: [],
})

const slotsOnServer = () => {
  const data = Object.entries(slots)
    .filter(([, fileId]) => fileId)
    .map(([slotName, fileId]) => ({
      id: 'slot-' + slotName,
      slotName,
      default: slotName === 'default',
      main: fileId === main,
      assetFile: fileOnServer(fileId!),
    }))

  return { data, totalCount: data.length }
}

const settled = () => vi.advanceTimersByTimeAsync(100)
const later = () => vi.advanceTimersByTimeAsync(6_000)

let answerRead: () => unknown = onServer

const holdNextRead = () => {
  let answer: () => void = () => undefined
  let asked = false
  answerRead = () => {
    if (asked) return onServer()
    asked = true

    return new Promise((resolve) => (answer = () => resolve(onServer())))
  }

  return () => {
    answer()

    return settled()
  }
}

const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )
const standsOut = (button: HTMLElement) => button.classList.contains('v-btn--variant-flat')

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_asset_delete', 'dam_image_update', 'dam_image_delete'],
    extSystem: { image: { slots: ['default', 'extra'] } },
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
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  const Page = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: Page })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))

  return { ...ui, page, tiles }
}

const openDetail = async (drawnIn: () => HTMLElement | null = dialogOfList) => {
  const ui = await start()
  ui.tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  const info = () => drawnIn()?.querySelector<HTMLElement>('.sidebar-info__content')
  await eventually(() => expect(info()?.querySelector('textarea')).toBeTruthy())
  const slotRow = (name: string) =>
    Array.from(info()?.querySelectorAll<HTMLElement>('.pa-4.pb-8') ?? []).find((row) =>
      row.querySelector('.font-weight-bold')?.textContent?.trim().startsWith(name)
    )
  const tab = async (mark: string) => {
    drawnIn()!.querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
    await settled()
  }
  const menuItem = (name: string) =>
    eventually(() => {
      const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (listed) => listed.textContent?.trim() === name
      )
      expect(found).toBeTruthy()

      return found!
    })
  const openFileMenu = async () => {
    info()!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
    await eventually(() => expect(menu()).not.toBeNull())
  }
  const closeMenu = async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await eventually(() => expect(menu()).toBeNull())
  }

  return {
    ...ui,
    drawnIn,
    title: () => info()?.querySelector<HTMLTextAreaElement>('textarea') ?? null,
    typeTitle: async () => {
      const field = info()!.querySelector<HTMLTextAreaElement>('textarea')!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()
    },
    saveButton: () => drawnIn()!.querySelector<HTMLButtonElement>('[data-cy="button-save"]')!,
    held: () => ({
      heldBack: drawnIn()!.querySelector<HTMLButtonElement>('[data-cy="button-save"]')!.disabled,
      saysWhy: !!drawnIn()!.textContent?.includes(STILL_PROCESSED),
    }),
    route: () =>
      Array.from(info()?.querySelectorAll('.v-chip') ?? [])
        .map((chip) => chip.textContent?.trim())
        .find((text) => text === PUBLIC || text === PRIVATE) ?? null,
    bar: () =>
      Array.from(drawnIn()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
        .map((part) => part.textContent?.trim())
        .join(' '),
    says: (text: string) => !!drawnIn()?.textContent?.includes(text),
    openInfo: () => tab('button-meta'),
    openSlots: async () => {
      await tab('button-slots')
      await eventually(() => expect(Object.keys(slots).every((name) => slotRow(name))).toBe(true))
    },
    openFileMenu,
    closeMenu,
    menuItem,
    makePrivate: async () => {
      await openFileMenu()
      ;(await menuItem('Make private')).click()
      await settled()
    },
    openSlotMenu: async (name: string) => {
      slotRow(name)!.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
      await eventually(() => expect(menu()).not.toBeNull())
    },
    removeFile: async (name: string) => {
      slotRow(name)!.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
      ;(await menuItem('Remove')).click()
      await settled()
      const remove = await eventually(() => {
        const button = document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-remove"]')
        expect(button).not.toBeNull()

        return button!
      })
      remove.click()
      await settled()
    },
    pressDelete: async () => {
      buttonsNamed(drawnIn()!, DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    },
  }
}

const disabled = (item: HTMLElement) => item.classList.contains('v-list-item--disabled')

beforeEach(() => {
  server = createFakeDam()
  slots = { default: FIRST, extra: SECOND }
  main = FIRST
  published = new Set([FIRST, SECOND])
  processed = { [FIRST]: 'processed', [SECOND]: 'processed' }
  status = 'with_file'
  answerRead = onServer
  server.assetBy(ASSET, () => answerRead())
  server.assetBy(OTHER, otherOnServer)
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', BY_FILE, async () => ({ status: 200, data: structuredClone(await answerRead()) }))
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [onServer(), otherOnServer()], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  for (const fileId of [FIRST, SECOND]) server.fileBy('image', fileId, () => fileOnServer(fileId))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', MAKE_PRIVATE, (_request, match) => {
    published.delete(match[1])

    return { status: 204 }
  })
  server.on('DELETE', FILE, (_request, match) => {
    for (const name of Object.keys(slots)) if (slots[name] === match[1]) slots[name] = null
    if (main === match[1]) main = slots.default ?? Object.values(slots).find(Boolean) ?? null

    return { status: 204 }
  })
  // core-dam marks an asset it deletes before it is gone.
  server.on('DELETE', DELETE_ASSET, () => {
    status = 'deleting'

    return { status: 204 }
  })
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('"Save" of the detail', () => {
  it('stands out only once something is typed into the form', async () => {
    const detail = await openDetail()
    expect(standsOut(detail.saveButton())).toBe(false)

    await detail.typeTitle()

    expect(standsOut(detail.saveButton())).toBe(true)
  })

  /*
   * What a save on its way took is not saved until the server says so.
   * The arrow to the next asset asks about it, and a failed save leaves it unsaved where it was typed.
   */
  it('on its way, leaves what it took to be asked about by an arrow: "Stay", and a save that fails keeps it', async () => {
    let fail: () => void = () => undefined
    server.on(
      'PATCH',
      BULK,
      () => new Promise<FakeDamAnswer>((_resolve, reject) => (fail = () => reject(httpError(500))))
    )
    const detail = await openDetail()
    await detail.typeTitle()
    const typedInto = detail.title()!
    detail.saveButton().click()
    await settled()

    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    await settled()

    expect([questions().length, detail.bar(), server.assetReads(OTHER)]).toEqual([1, '1 / 2 The asset', 0])
    buttonsNamed(questions()[0], STAY)[0].click()
    await settled()
    fail()
    await settled()
    expect([detail.alerts(), detail.title() === typedInto, typedInto.value, standsOut(detail.saveButton())]).toEqual([
      [SYSTEM_ERROR],
      true,
      TYPED,
      true,
    ])
  })
})

describe('a change of the route of the main file of the detail', () => {
  /*
   * Typed under, the form stays drawn while the asset is read for its file.
   * The menu opened again meanwhile offered the same change,
   * which the server refuses because the route is gone by then.
   */
  it('is offered no more until the asset is read again, and then the opposite one is', async () => {
    const detail = await openDetail()
    await detail.typeTitle()
    const answer = holdNextRead()
    await detail.makePrivate()
    expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1)

    await detail.openFileMenu()
    const again = await detail.menuItem('Make private')
    expect(disabled(again)).toBe(true)
    again.click()
    await settled()
    expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1)
    await detail.closeMenu()

    await answer()
    expect(detail.route()).toBe(PRIVATE)
    await detail.openFileMenu()
    expect(disabled(await detail.menuItem('Make public'))).toBe(false)
  })

  /*
   * When the user went to the page of the same asset while the change was on its way, that page knew nothing of it.
   * The list was left, and the list was the one told.
   */
  it('is told to the page of the asset gone to from the list while it was on its way', async () => {
    const detail = await openDetail()
    let madePrivate: () => void = () => undefined
    server.on(
      'PATCH',
      MAKE_PRIVATE,
      (_request, match) =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (madePrivate = () => {
              published.delete(match[1])
              resolve({ status: 204 })
            })
        )
    )
    await detail.makePrivate()
    await detail.closeMenu()
    // Not awaited before the clock moves: an open Vuetify dialog holds a navigation back with a timer.
    void detail.router.push('/assets/' + ASSET)
    await settled()
    const onThePage = () => detail.page
    await eventually(() => expect(onThePage().querySelector('.sidebar-info__content textarea')).toBeTruthy())
    const routeOnThePage = () =>
      Array.from(onThePage().querySelectorAll('.sidebar-info__content .v-chip'))
        .map((chip) => chip.textContent?.trim())
        .find((text) => text === PUBLIC || text === PRIVATE)
    expect(routeOnThePage()).toBe(PUBLIC)

    madePrivate()
    await settled()

    await eventually(() => expect(routeOnThePage()).toBe(PRIVATE))
  })

  it('names the asset in the bar while the detail reads it again behind its loader', async () => {
    const detail = await openDetail()
    const answer = holdNextRead()

    await detail.makePrivate()

    expect([detail.title(), detail.bar()]).toEqual([null, '1 / 2 The asset'])
    await answer()
    expect(detail.bar()).toBe('1 / 2 The asset')
  })
})

/*
 * A processed main file does not mean the server has filled in the metadata from a file.
 * core-dam does that once, and an asset can have processed files without it (migration).
 * Replacing its only file, put into its slot under what was typed, can
 * still fill them in, so "Uložiť" is held back as for any file on its way.
 */
describe('the replacement of the only file of an asset that is not described, under what was typed', () => {
  it('holds "Uložiť" back while it is on its way, and once it is processed', async () => {
    slots = { default: FIRST }
    const NEW = 'dddddddd-2222-4333-8444-555555555555'
    server.fileBy('image', NEW, () => fileOnServer(NEW))
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    const detail = await openDetail()
    await detail.typeTitle()
    expect(detail.held().heldBack).toBe(false)
    await detail.openSlots()
    await detail.removeFile('default')
    await eventually(() => expect(main).toBeNull())
    await detail.openInfo()
    slots = { default: NEW }
    main = NEW
    processed[NEW] = 'stored'
    useAssetDetailStore().fileStatusOnServer(ASSET, NEW, 'stored')
    await settled()

    expect([detail.title()?.value, detail.held()]).toEqual([TYPED, { heldBack: true, saysWhy: true }])

    processed[NEW] = 'processed'
    useAssetDetailStore().fileStatusOnServer(ASSET, NEW, 'processed')
    await settled()
    expect([detail.title()?.value, detail.held().heldBack]).toEqual([TYPED, true])
  })
})

/*
 * The server fills in the metadata of an undescribed asset from a file before its processing ends.
 * A file of another slot that fails afterwards has changed them just as a processed one has.
 */
describe('a file of another slot of the asset of the detail', () => {
  it('that failed has the asset read again with nothing typed, as one that is processed', async () => {
    const detail = await openDetail()
    const before = reads()
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

    useAssetDetailStore().fileStatusOnServer(ASSET, SECOND, 'failed')
    await settled()

    expect([reads() - before, detail.title()?.value]).toEqual([1, 'from the server'])
  })
})

describe('the detail of an asset deleted in it', () => {
  it('closes over it also when another tab was opened before the delete was answered', async () => {
    let deleted: () => void = () => undefined
    server.on(
      'DELETE',
      DELETE_ASSET,
      () =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (deleted = () => {
              status = 'deleting'
              resolve({ status: 204 })
            })
        )
    )
    const detail = await openDetail()
    await detail.pressDelete()
    await detail.openSlots()

    deleted()
    await settled()

    await eventually(() => expect(dialogOfList()).toBeNull())
    expect(panel().textContent).toContain(BEING_DELETED)
  })

  /*
   * An asset held as being deleted is no longer read into the detail. A
   * read asked before the delete went through can answer it as it was.
   * A read asked after that answers as the server has it, here not deleted after all.
   */
  it('takes a read of it asked after the delete was answered', async () => {
    const detail = await openDetail()
    await detail.pressDelete()
    await eventually(() => expect(dialogOfList()).toBeNull())
    expect(panel().textContent).toContain(BEING_DELETED)
    status = 'with_file'
    await later()

    detail.tiles()[0].click()
    await settled()

    expect([panel().textContent?.includes(BEING_DELETED), buttonsNamed(panel(), 'Save')[0].disabled]).toEqual([
      false,
      false,
    ])
  })
})

describe('the detail of an asset whose delete is answered after the detail went on to the next one', () => {
  it('stays open over the next asset while that one is being read', async () => {
    let deleted: () => void = () => undefined
    server.on(
      'DELETE',
      DELETE_ASSET,
      () =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (deleted = () => {
              status = 'deleting'
              resolve({ status: 204 })
            })
        )
    )
    let answerOther: () => void = () => undefined
    server.assetBy(OTHER, () => new Promise((resolve) => (answerOther = () => resolve(otherOnServer()))))
    const detail = await openDetail()
    await detail.pressDelete()
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    await settled()
    expect(detail.bar()).toBe('2 / 2 Another asset')

    deleted()
    await settled()

    expect(dialogOfList()).not.toBeNull()
    answerOther()
    await settled()
    expect([dialogOfList() !== null, detail.bar()]).toEqual([true, '2 / 2 Another asset'])
  })
})

/*
 * The server marks the asset as being deleted before it answers the delete.
 * A detail read answered in between found it so, and told the user who deleted it that it was deleted meanwhile.
 */
describe('a read of the asset of the detail answered while its own delete is on its way', () => {
  it('says nothing of a delete meanwhile', async () => {
    let deleted: () => void = () => undefined
    server.on('DELETE', DELETE_ASSET, () => {
      status = 'deleting'

      return new Promise<FakeDamAnswer>((resolve) => (deleted = () => resolve({ status: 204 })))
    })
    const detail = await openDetail()
    await detail.typeTitle()
    await detail.pressDelete()

    await detail.makePrivate()
    await eventually(() => expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1))
    await settled()
    expect(detail.alerts()).toEqual([])

    deleted()
    await eventually(() => expect(dialogOfList()).toBeNull())
    expect(detail.alerts()).toEqual(['Record was removed'])
  })
})

/*
 * Deleted elsewhere while the delete here was on its way, the asset was taken over as
 * being deleted with nothing said, because the delete here was the likelier cause.
 * When that delete failed, nothing was said either.
 */
describe('a read of the asset of the detail answered while its own delete is on its way, which then fails', () => {
  it('says the asset was deleted meanwhile once that delete has failed', async () => {
    let refused: () => void = () => undefined
    server.on('DELETE', DELETE_ASSET, () => {
      status = 'deleting'

      return new Promise<FakeDamAnswer>((_resolve, reject) => (refused = () => reject(httpError(404))))
    })
    const detail = await openDetail()
    await detail.typeTitle()
    await detail.pressDelete()
    await detail.makePrivate()
    await eventually(() => expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1))
    await settled()
    expect(detail.alerts()).toEqual([])

    refused()
    await settled()

    expect(detail.alerts()).toContain(DELETED_MEANWHILE)
  })

  it('says nothing of a delete meanwhile once the page was left before that delete failed', async () => {
    let refused: () => void = () => undefined
    server.on('DELETE', DELETE_ASSET, () => {
      status = 'deleting'

      return new Promise<FakeDamAnswer>((_resolve, reject) => (refused = () => reject(httpError(404))))
    })
    const detail = await openDetail()
    detail.router.addRoute({ path: '/settings', component: { render: () => null } })
    await detail.typeTitle()
    await detail.pressDelete()
    await detail.makePrivate()
    await eventually(() => expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1))
    await detail.closeMenu()
    void detail.router.push('/settings')
    await settled()
    buttonsNamed(questions()[0], 'Leave anyway')[0].click()
    await eventually(() => expect(detail.router.currentRoute.value.path).toBe('/settings'))

    refused()
    await vi.advanceTimersByTimeAsync(2_000)

    expect([detail.alerts().length, detail.alerts().includes(DELETED_MEANWHILE)]).toEqual([1, false])
  })
})

/*
 * Deleted elsewhere, the asset was taken as being deleted by the
 * next read of its file, and only its buttons going off said so.
 */
describe('the detail of an asset deleted elsewhere meanwhile', () => {
  it('says so as a read of it takes it over as being deleted', async () => {
    const detail = await openDetail()
    await detail.typeTitle()
    status = 'deleting'

    await detail.makePrivate()

    await eventually(() => expect(detail.alerts()).toEqual([DELETED_MEANWHILE]))
    expect([detail.says(BEING_DELETED), detail.saveButton().disabled, detail.title()?.value]).toEqual([
      true,
      true,
      TYPED,
    ])
  })
})

/*
 * An asset being deleted had only "Save" and "Delete" off.
 * Changes of its file, slots and file route went to an asset
 * that was going. Reading it (downloading files) stays allowed.
 */
/*
 * The page of an asset left it by the event of the part that deleted it.
 * When another tab was opened before the answer, that part was gone,
 * and the page stayed on the asset being deleted with nothing said.
 */
describe('the page of an asset deleted in it', () => {
  const openPage = async () => {
    const ui = await start()
    void ui.router.push('/assets/' + ASSET)
    await settled()
    const info = () => ui.page.querySelector<HTMLElement>('.sidebar-info__content')
    await eventually(() => expect(info()?.querySelector('textarea')).toBeTruthy())
    const tab = async (mark: string) => {
      ui.page.querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
      await settled()
    }
    const pressDelete = async () => {
      buttonsNamed(ui.page, DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    }

    return { ...ui, info, tab, pressDelete }
  }

  it('says the asset was deleted meanwhile when another tab was opened before the delete was answered', async () => {
    let deleted: () => void = () => undefined
    server.on(
      'DELETE',
      DELETE_ASSET,
      () =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (deleted = () => {
              status = 'deleting'
              resolve({ status: 204 })
            })
        )
    )
    const page = await openPage()
    await page.pressDelete()
    await page.tab('button-slots')

    deleted()
    await settled()

    expect([page.alerts(), page.router.currentRoute.value.path]).toEqual([
      ['Record was removed', DELETED_MEANWHILE],
      '/assets/' + ASSET,
    ])
    await page.tab('button-meta')
    await eventually(() => expect(page.info()?.textContent).toContain(BEING_DELETED))
    expect(buttonsNamed(page.page, 'Save')[0].disabled).toBe(true)
  })

  it('says nothing more when it closes over the asset by the event of the part that deleted it', async () => {
    const page = await openPage()

    await page.pressDelete()

    await eventually(() => expect(page.router.currentRoute.value.path).toBe(LIST))
    expect(page.alerts()).toEqual(['Record was removed'])
  })
})

/*
 * The page of the asset of a file was emptied by the event of the part that deleted the asset.
 * When another tab was opened before the answer, it stayed on the asset being deleted with nothing said.
 */
describe('the page of the asset of a file deleted in it', () => {
  const openFilePage = async () => {
    const ui = await start()
    const FilePage = (await import('@/domains/coreDam/asset/components/detail/AssetFileDetailView.vue')).default
    ui.router.addRoute({ path: '/assets/file/:id', name: '/(coreDam)/assets/file/[id]', component: FilePage })
    void ui.router.push('/assets/file/' + FIRST)
    await settled()
    await eventually(() => expect(ui.page.querySelector('.sidebar-info__content textarea')).toBeTruthy())
    const pressDelete = async () => {
      buttonsNamed(ui.page, DELETE)[0].click()
      await eventually(() => expect(dialogButton(DELETE)).not.toBeNull())
      dialogButton(DELETE)!.click()
      await settled()
    }

    return { ...ui, pressDelete }
  }

  it.each<[string, boolean, string[]]>([
    ['with another tab opened before the delete was answered', true, ['Record was removed', DELETED_MEANWHILE]],
    ['with the Info tab still open, which empties it', false, ['Record was removed']],
  ])('says the asset was deleted meanwhile only %s', async (_how, otherTab, alerts) => {
    let deleted: () => void = () => undefined
    server.on(
      'DELETE',
      DELETE_ASSET,
      () =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (deleted = () => {
              status = 'deleting'
              resolve({ status: 204 })
            })
        )
    )
    const page = await openFilePage()
    await page.pressDelete()
    if (otherTab) {
      page.page.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
      await settled()
    }

    deleted()
    await settled()

    expect(page.alerts()).toEqual(alerts)
  })
})

describe('the actions of the detail of an asset being deleted', () => {
  it.each<[string, () => Promise<Awaited<ReturnType<typeof openDetail>>>]>([
    [
      'opened as it is',
      async () => {
        status = 'deleting'

        return openDetail()
      },
    ],
    [
      'deleted elsewhere while it is open',
      async () => {
        const detail = await openDetail()
        await detail.typeTitle()
        status = 'deleting'
        const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
        useAssetDetailStore().fileStatusOnServer(ASSET, SECOND, 'processed')
        await eventually(() => expect(detail.says(BEING_DELETED)).toBe(true))

        return detail
      },
    ],
  ])('change nothing of it %s, and its files can be downloaded', async (_how, open) => {
    const detail = await open()

    await detail.openFileMenu()
    expect(disabled(await detail.menuItem('Make private'))).toBe(true)
    await detail.closeMenu()
    await detail.openSlots()
    await detail.openSlotMenu('extra')
    const items = await Promise.all(['Make main file', 'Remove', 'Download'].map((name) => detail.menuItem(name)))

    expect(items.map(disabled)).toEqual([true, true, false])
  })
})
