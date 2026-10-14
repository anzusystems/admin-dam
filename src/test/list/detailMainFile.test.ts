import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The Info tab of a detail shows the main file of the asset, and "Save" of its form sends three switches that are
 * that file's own. Which file is the main one changes from the Slots tab: another file is made the main one, or the
 * main file is deleted and the server makes another file of the asset the main one, or none. The page that draws the
 * detail is told of it, and of a change of the route of the main file, and reads the asset again: whole while
 * nothing typed into the form waits to be saved, and for its file alone while something does. It is told by a
 * function it provides, so also once the tab that made the change is gone. The real pages - the list with its
 * dialog and its panel, the page of an asset, the page of the asset of a file - and the application around them as
 * it starts; the server is a fake, and so is the address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const BY_FILE = /^\/adm\/v1\/asset\/asset-file\/([^/]+)$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/([^/]+)\/make-private$/
const MAKE_PUBLIC = /^\/adm\/v1\/image\/([^/]+)\/make-public$/
const MAIN = /^\/adm\/v1\/image\/([^/]+)\/asset\/([^/]+)\/main$/
const FILE = /^\/adm\/v1\/image\/([^/]+)$/

const UNSAVED = 'Unsaved changes'
const LEAVE = 'Leave anyway'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const PUBLIC = 'File is public'
const PRIVATE = 'File is private'
const STILL_PROCESSED = 'The file is still being processed.'
/** The three switches of the form that are the main file's own, as they are labelled, in the order of the form. */
const SWITCHES = ['Single-use license', 'Override internal flag', 'Internal']

const LIST = '/assets'
const ASSET = '11111111-2222-4333-8444-555555555555'
/** The two files of the asset: the first in its slot "default", the second in its slot "extra". */
const FIRST = 'aaaaaaaa-2222-4333-8444-555555555555'
const SECOND = 'bbbbbbbb-2222-4333-8444-555555555555'
/** Another asset of the list, with a file of its own. */
const OTHER = '22222222-2222-4333-8444-555555555555'
const OF_OTHER = 'cccccccc-2222-4333-8444-555555555555'

interface Switches {
  singleUse: boolean
  overrideInternal: boolean
  internal: boolean
}
const OFF: Switches = { singleUse: false, overrideInternal: false, internal: false }

/* What the server holds of the asset: the file of each of its two slots, which file is the main one, which files
 * are public, how far each is processed and the three switches of each. */
let slots: Record<string, string | null> = {}
let main: string | null = FIRST
let published = new Set<string>()
let processed: Record<string, 'stored' | 'processed'> = {}
let switches: Record<string, Switches> = {}

const routeOf = (fileId: string) => ({ id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId })

const fileOnServer = (fileId: string, assetId = ASSET) => ({
  ...assetFile(fileId, processed[fileId] ?? 'processed', {
    asset: assetId,
    flags: { ...(switches[fileId] ?? OFF) },
  }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: published.has(fileId) ? routeOf(fileId) : null,
})

/** The asset as the server holds it now: an image of the licence of the user. */
const onServer = () => ({
  ...assetDetail(ASSET, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    licence: 1,
    texts: { displayTitle: 'The asset' },
    // Not described: while its main file is not processed, the server may yet fill in its metadata.
    flags: { described: false, visible: true },
    mainFile: main ? fileOnServer(main) : null,
    mainFileSingleUse: main ? switches[main].singleUse : false,
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

/** The slots of the asset as the server lists them: those that hold a file. */
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

/* The changes of a file, as core-dam does them and answers them: 200 with the file for a file made the main one,
 * 200 with the route for a file made public, 204 for a file made private and for a file deleted. With its main file
 * deleted the asset gets the file of its default slot for the main one, or of the first slot that holds one, or
 * none. */
const madeMain = (fileId: string): FakeDamAnswer => {
  main = fileId

  return { status: 200, data: fileOnServer(fileId) }
}
const madePrivate = (fileId: string): FakeDamAnswer => {
  published.delete(fileId)

  return { status: 204 }
}
const madePublic = (fileId: string): FakeDamAnswer => {
  published.add(fileId)

  return { status: 200, data: routeOf(fileId) }
}
const deleted = (fileId: string): FakeDamAnswer => {
  for (const name of Object.keys(slots)) if (slots[name] === fileId) slots[name] = null
  if (main === fileId) main = slots.default ?? Object.values(slots).find(Boolean) ?? null

  return { status: 204 }
}

const settled = () => vi.advanceTimersByTimeAsync(100)
// Longer than the list takes an asset it has just read for read.
const later = () => vi.advanceTimersByTimeAsync(6_000)

/** The change is held from now on: sent, it is done and answered only once let go. */
const hold = (method: 'PATCH' | 'DELETE', pattern: RegExp, change: (fileId: string) => FakeDamAnswer) => {
  let letGo: () => void = () => undefined
  server.on(
    method,
    pattern,
    (_request, match) => new Promise<FakeDamAnswer>((resolve) => (letGo = () => resolve(change(match[1]))))
  )

  return () => {
    letGo()

    return settled()
  }
}

/** How a read of the asset is answered: at once with what the server holds, unless a case holds it. */
let answerRead: () => unknown = onServer

/* The next read of the asset is held, every later one answers at once. Let go, it answers what the server held when
 * it was asked, or fails. */
const holdNextRead = () => {
  let answer: (went: boolean) => void = () => undefined
  let asked = false
  answerRead = () => {
    if (asked) return onServer()
    asked = true
    const asRead = onServer()

    return new Promise((resolve, reject) => (answer = (went) => (went ? resolve(asRead) : reject(httpError(500)))))
  }

  return (went = true) => {
    answer(went)

    return settled()
  }
}

/** How many times the server was asked for the asset, by its own id or by the id of its file. */
const reads = () =>
  server.sent('GET').filter((request) => request.url === '/adm/v1/asset/' + ASSET || BY_FILE.test(request.url)).length

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const start = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_image_delete'],
    extSystem: { image: { slots: ['default', 'extra'] } },
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
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })

  return ui
}

type Ui = Awaited<ReturnType<typeof start>>

/** A place the detail of the asset is drawn in: opened, it answers the element the detail is drawn in. */
type Place = () => Promise<{ ui: Ui; drawnIn: () => HTMLElement; tiles: () => HTMLElement[] }>

const inTheDialogOfTheList: Place = async () => {
  const ui = await start()
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(2))
  tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()

  return { ui, drawnIn: () => dialogOfList()!, tiles }
}

/** The page of a detail, as the router draws it at the address. */
const onPage = async (name: string, path: string, load: () => Promise<{ default: unknown }>, address: string) => {
  const ui = await start()
  ui.router.addRoute({ path, name, component: (await load()).default as never })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))

  return { ui, drawnIn: () => page, tiles: () => [] }
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

const places: Array<[string, Place]> = [
  ['the dialog over the list', inTheDialogOfTheList],
  ['the page of an asset', onThePageOfTheAsset],
  ['the page of the asset of a file', onThePageOfTheFile],
]

/** What a form says of the asset it holds: the ids of the asset and of its main file, and whether that is public. */
const formSays = (form: ParentNode | null | undefined) => ({
  file:
    Array.from(form?.querySelectorAll('.anzu-copy-text > span') ?? []).map((id) => id.textContent?.trim())[1] ?? null,
  route:
    Array.from(form?.querySelectorAll('.v-chip') ?? [])
      .map((chip) => chip.textContent?.trim())
      .find((text) => text === PUBLIC || text === PRIVATE) ?? null,
})

/** "Save" of a form: whether it is held back, and whether the form says why. */
const saveOf = (form: HTMLElement) => ({
  heldBack: buttonsNamed(form, 'Save')[0]?.disabled,
  saysWhy: !!form.textContent?.includes(STILL_PROCESSED),
})

/** The detail of the asset, opened in the place and drawn: what a case reads of it, and what it does in it. */
const openDetail = async (place: Place) => {
  const { ui, drawnIn, tiles } = await place()
  const info = () => drawnIn()?.querySelector<HTMLElement>('.sidebar-info__content')
  await eventually(() => expect(formSays(info()).file).toBe(main))
  /** The rows of the Slots tab by the name of their slot. */
  const slotRow = (name: string) =>
    Array.from(info()?.querySelectorAll<HTMLElement>('.pa-4.pb-8') ?? []).find((row) =>
      row.querySelector('.font-weight-bold')?.textContent?.trim().startsWith(name)
    )
  const tab = async (mark: string) => {
    drawnIn().querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
    await settled()
  }
  /** The item of an open menu, by what it says: pressed. */
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
  const switchOf = (label: string) =>
    Array.from(info()?.querySelectorAll('.v-switch') ?? [])
      .find((control) => control.querySelector('label')?.textContent?.trim() === label)
      ?.querySelector<HTMLInputElement>('input')

  return {
    ui,
    drawnIn,
    tiles,
    /** What the Info tab says of the main file. */
    info: () => formSays(info()),
    title: () => info()?.querySelector<HTMLTextAreaElement>('textarea') ?? null,
    typeTitle: async () => {
      const field = info()!.querySelector<HTMLTextAreaElement>('textarea')!
      field.value = TYPED
      field.dispatchEvent(new Event('input'))
      await nextTick()
    },
    /** The three switches of the main file as the Info tab shows them: null for one it does not draw. */
    switches: () => SWITCHES.map((label) => switchOf(label)?.checked ?? null),
    flip: async (label: string) => {
      switchOf(label)!.click()
      await nextTick()
    },
    saveButton: () => saveOf(drawnIn()),
    /** "Save" of the Info tab pressed, and answered: the title and the three switches it sent. */
    save: async () => {
      drawnIn().querySelector<HTMLButtonElement>('[data-cy="button-save"]')!.click()
      await settled()
      const sent = JSON.parse(String(server.sent('PATCH', BULK).at(-1)?.data))[0]

      return [sent.customData.title, [sent.mainFileSingleUse, sent.mainFileOverrideInternal, sent.mainFileInternal]]
    },
    openInfo: () => tab('button-meta'),
    /** The Slots tab, its two rows drawn. */
    openSlots: async () => {
      await tab('button-slots')
      await eventually(() => expect([slotRow('default'), slotRow('extra')].every(Boolean)).toBe(true))
    },
    /** Whether the rows of the two slots are drawn: not while the tab reads them, nor behind the loader. */
    slotsDrawn: () => [slotRow('default'), slotRow('extra')].every(Boolean),
    /** What the row of the slot says of its file in the Slots tab: the main one or not, public or not. */
    slot: (name: string) => ({
      main: !!slotRow(name)?.querySelector('.font-weight-bold')?.textContent?.includes('Main file'),
      route: formSays(slotRow(name)).route,
    }),
    /** "Make private" of the menu of the file card of the Info tab. */
    makePrivateInInfo: async () => {
      info()!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
      await pressMenuItem('Make private')
    },
    /** "Make public" of the menu of the file card of the Info tab, confirmed in its dialog, and the dialog closed. */
    makePublicInInfo: async () => {
      info()!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
      await pressMenuItem('Make public')
      const dialog = () =>
        Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find(
          (open) => buttonsNamed(open, 'Confirm').length === 1
        )
      await eventually(() => expect(dialog()).toBeTruthy())
      buttonsNamed(dialog()!, 'Confirm')[0].click()
      await settled()
      buttonsNamed(dialog()!, 'Cancel')[0].click()
      await eventually(() => expect(dialog()).toBeUndefined())
    },
    /** "Make private" of the menu of the file of the row of the slot. */
    makePrivateInSlot: async (name: string) => {
      slotRow(name)!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
      await pressMenuItem('Make private')
    },
    /** "Make main file" of the menu of the row of the slot. */
    makeMain: async (name: string) => {
      slotRow(name)!.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
      await pressMenuItem('Make main file')
    },
    /** The file of the slot deleted: "Remove" of the menu of its row, and "Remove file" of the dialog it opens. */
    removeFile: async (name: string) => {
      slotRow(name)!.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
      await pressMenuItem('Remove')
      const remove = await eventually(() => {
        const button = document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-remove"]')
        expect(button).not.toBeNull()

        return button!
      })
      remove.click()
      await settled()
    },
    /** The detail over the list closed: its asset stays in the panel beside the list. */
    close: async () => {
      drawnIn().querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
      await eventually(() => expect(dialogOfList()).toBeNull())
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  slots = { default: FIRST, extra: SECOND }
  main = FIRST
  published = new Set([FIRST, SECOND])
  processed = { [FIRST]: 'processed', [SECOND]: 'processed' }
  switches = { [FIRST]: { ...OFF }, [SECOND]: { ...OFF } }
  answerRead = onServer
  server.assetBy(ASSET, () => answerRead())
  server.assetBy(OTHER, otherOnServer)
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  // As core-dam answers it: the asset of a file that was deleted is not found.
  server.on('GET', BY_FILE, async (_request, match) => {
    if (!Object.values(slots).includes(match[1])) throw httpError(404)

    return { status: 200, data: structuredClone(await answerRead()) }
  })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [onServer(), otherOnServer()], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The file of an image, as the row of its slot reads it to draw it.
  for (const fileId of [FIRST, SECOND]) server.fileBy('image', fileId, () => fileOnServer(fileId))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', MAIN, (_request, match) => madeMain(match[1]))
  server.on('PATCH', MAKE_PRIVATE, (_request, match) => madePrivate(match[1]))
  server.on('PATCH', MAKE_PUBLIC, (_request, match) => madePublic(match[1]))
  server.on('DELETE', FILE, (_request, match) => deleted(match[1]))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* With metadata typed and not saved, the form takes only the new main file of the asset: the rest of it is as it
 * was read before the change. */
describe('the form of a detail, once the asset has another main file under metadata that were not saved', () => {
  /* "Save" is held back while the main file is not processed and the asset is not described: the server may yet fill
   * in its metadata from the file. A processed file made the main one took that away, over a form read before it. */
  it('keeps "Save" held back when it was so before, until the asset is read whole', async () => {
    processed[FIRST] = 'stored'
    const detail = await openDetail(inTheDialogOfTheList)
    expect(detail.saveButton()).toEqual({ heldBack: true, saysWhy: true })
    await detail.typeTitle()
    await detail.openSlots()

    await detail.makeMain('extra')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))
    await detail.openInfo()

    expect([detail.info().file, detail.title()?.value]).toEqual([SECOND, TYPED])
    expect(detail.saveButton()).toEqual({ heldBack: true, saysWhy: true })

    // In the panel beside the list too, which holds the asset once its detail is closed.
    await detail.close()
    expect([formSays(panel()).file, saveOf(panel())]).toEqual([SECOND, { heldBack: true, saysWhy: true }])

    // Read whole - opened again, long enough after its read, and told to leave what was typed - it has a form as new
    // as its main file, which is processed.
    await later()
    detail.tiles()[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    const question = await eventually(() => {
      const found = Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).find((dialog) =>
        dialog.textContent?.includes(UNSAVED)
      )
      expect(found).toBeTruthy()

      return found!
    })
    buttonsNamed(question, LEAVE)[0].click()
    await eventually(() => expect(detail.title()?.value).toBe('from the server'))

    expect([reads(), detail.info().file, detail.saveButton()]).toEqual([3, SECOND, { heldBack: false, saysWhy: false }])
  })

  /* "Save" sends the three switches, and the server writes them onto the main file the asset has by then: those of
   * the file before it were written over the new one's. */
  it('shows the three switches of the new main file, and "Save" sends them', async () => {
    switches[FIRST] = { singleUse: true, overrideInternal: false, internal: false }
    switches[SECOND] = { singleUse: false, overrideInternal: true, internal: true }
    const detail = await openDetail(inTheDialogOfTheList)
    expect(detail.switches()).toEqual([true, false, false])
    await detail.typeTitle()
    await detail.openSlots()

    await detail.makeMain('extra')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))
    await detail.openInfo()

    expect([detail.info().file, detail.switches()]).toEqual([SECOND, [false, true, true]])
    expect(await detail.save()).toEqual([TYPED, [false, true, true]])
  })

  // It was flipped for the file that is the main one no more.
  it('shows a switch that was flipped and not saved as the new main file has it', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.flip(SWITCHES[0])
    expect(detail.switches()).toEqual([true, false, false])
    await detail.openSlots()

    await detail.makeMain('extra')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))
    await detail.openInfo()

    expect([detail.info().file, detail.switches()]).toEqual([SECOND, [false, false, false]])
    expect((await detail.save())[1]).toEqual([false, false, false])
  })

  // The guard: the main file is the one the switch was flipped for, and only its route is taken.
  it('leaves a switch as it was flipped when only the route of the main file has changed', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.flip(SWITCHES[0])
    await detail.openSlots()

    await detail.makePrivateInSlot('default')
    await eventually(() => expect(detail.slot('default').route).toBe(PRIVATE))
    await detail.openInfo()

    expect([detail.info(), detail.switches()]).toEqual([{ file: FIRST, route: PRIVATE }, [true, false, false]])
    expect((await detail.save())[1]).toEqual([true, false, false])
  })
})

/* The delete of a file read only the slots again. With the main file deleted the Info tab went on showing it - its
 * id, its route, its menu - and "Save" sent its switches for the file the server had made the main one. */
describe('the Info tab of a detail, once the main file of the asset is deleted in the Slots tab', () => {
  beforeEach(() => {
    // The second file is private, to tell the two apart by their route as well.
    published = new Set([FIRST])
  })

  it('shows the file the server made the main one: read whole while nothing was typed', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const slotsRead = server.slotReads(ASSET)

    await detail.removeFile('default')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))

    // The slots are read once more, by the tab as it is drawn again.
    expect([reads(), server.slotReads(ASSET) - slotsRead]).toEqual([2, 1])
    await detail.openInfo()
    expect([detail.info(), detail.ui.alerts()]).toEqual([{ file: SECOND, route: PRIVATE }, []])
  })

  it('shows it with metadata typed and not saved, which stay, with the switches of that file', async () => {
    switches[FIRST] = { singleUse: true, overrideInternal: true, internal: true }
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.typeTitle()
    await detail.openSlots()

    await detail.removeFile('default')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))
    await detail.openInfo()

    expect([reads(), detail.info(), detail.switches()]).toEqual([
      2,
      { file: SECOND, route: PRIVATE },
      [false, false, false],
    ])
    expect(await detail.save()).toEqual([TYPED, [false, false, false]])
  })

  it('shows no file once the only one is deleted, and the switches off', async () => {
    slots = { default: FIRST, extra: null }
    switches[FIRST] = { singleUse: true, overrideInternal: true, internal: true }
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.typeTitle()
    await detail.openSlots()

    await detail.removeFile('default')
    await eventually(() => expect(server.slotReads(ASSET)).toBe(2))
    await detail.openInfo()

    // The two switches of the file of an image are not drawn for an asset with no main file.
    expect([reads(), detail.info(), detail.switches()]).toEqual([2, { file: null, route: null }, [false, null, null]])
    expect(await detail.save()).toEqual([TYPED, [false, false, false]])
  })

  /* The page of the asset of a file is come to by the id of a file, and read the asset again by that id: with that
   * very file deleted the read was answered "not found", and the page said so over the asset as it was before. */
  it('shows it on the page of the asset of a file, when that file is the one deleted', async () => {
    main = SECOND
    const detail = await openDetail(onThePageOfTheFile)
    await detail.openSlots()

    await detail.removeFile('extra')
    await eventually(() => expect(detail.slot('default').main).toBe(true))
    await detail.openInfo()

    expect([detail.info(), detail.ui.alerts()]).toEqual([{ file: FIRST, route: PUBLIC }, []])
  })

  // The guard: the asset keeps its main file, and there is nothing new to read of it.
  it('is not read again for a deleted file that is not the main one', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()

    await detail.removeFile('extra')
    await eventually(() => expect(server.slotReads(ASSET)).toBe(2))

    expect([reads(), detail.slot('default').main]).toEqual([1, true])
    await detail.openInfo()
    expect(detail.info()).toEqual({ file: FIRST, route: PUBLIC })
  })

  // The guard: a delete the server refused changed nothing.
  it('is not read again after a delete of the main file the server refused', async () => {
    server.on('DELETE', FILE, () => {
      throw httpError(500)
    })
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()

    await detail.removeFile('default')
    await eventually(() => expect(detail.ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([reads(), detail.slot('default').main]).toEqual([1, true])
  })
})

/* The tab that made the change told the page by an event, once the change was answered: left meanwhile, the tab was
 * unmounted, and what an unmounted component emits Vue drops. The Info tab went on showing the file before. */
describe('the page that draws a detail, told of a change of the main file answered after its tab was left', () => {
  beforeEach(() => {
    published = new Set([FIRST])
  })

  it.each(places)('shows the new main file in the Info tab opened meanwhile, in %s', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.openInfo()
    expect([reads(), detail.info().file]).toEqual([1, FIRST])
    await answer()

    await eventually(() => expect(detail.info()).toEqual({ file: SECOND, route: PRIVATE }))
    expect([reads(), detail.ui.alerts()]).toEqual([2, []])
  })

  it('shows it in the panel beside the list, once the detail was closed meanwhile', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.close()
    expect(formSays(panel()).file).toBe(FIRST)
    await answer()

    await eventually(() => expect(formSays(panel())).toEqual({ file: SECOND, route: PRIVATE }))
    expect(reads()).toBe(2)
  })

  it('shows the route changed in the row of the main file, in the Info tab opened meanwhile', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const answer = hold('PATCH', MAKE_PRIVATE, madePrivate)

    await detail.makePrivateInSlot('default')
    await detail.openInfo()
    expect(detail.info()).toEqual({ file: FIRST, route: PUBLIC })
    await answer()

    await eventually(() => expect(detail.info()).toEqual({ file: FIRST, route: PRIVATE }))
    expect(reads()).toBe(2)
  })

  // The menu of the file card of the Info tab told the page the same way.
  it('shows the route changed in the Info tab itself, with another tab opened meanwhile', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    const answer = hold('PATCH', MAKE_PRIVATE, madePrivate)

    await detail.makePrivateInInfo()
    await detail.openSlots()
    await answer()
    await eventually(() => expect(reads()).toBe(2))
    await eventually(() => expect(detail.slotsDrawn()).toBe(true))
    await detail.openInfo()

    expect(detail.info()).toEqual({ file: FIRST, route: PRIVATE })
  })

  /* "Make public" is confirmed in a dialog of the card, which told the card by an event of its own: closed while
   * the change is on its way, and its tab left, the dialog is unmounted with the card. */
  it('shows the file made public from the Info tab, with its dialog closed and another tab opened meanwhile', async () => {
    published = new Set()
    const detail = await openDetail(inTheDialogOfTheList)
    const answer = hold('PATCH', MAKE_PUBLIC, madePublic)

    await detail.makePublicInInfo()
    await detail.openSlots()
    await answer()
    await eventually(() => expect(reads()).toBe(2))
    await eventually(() => expect(detail.slotsDrawn()).toBe(true))
    await detail.openInfo()

    expect(detail.info()).toEqual({ file: FIRST, route: PUBLIC })
  })

  // The guard: the answer is of an asset the detail holds no more.
  it('reads nothing once the list holds another asset by the answer', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.close()
    detail.tiles()[1].click()
    await eventually(() => expect(formSays(panel()).file).toBe(OF_OTHER))
    await answer()

    expect([reads(), server.assetReads(OTHER), formSays(panel()).file, detail.ui.alerts()]).toEqual([
      1,
      1,
      OF_OTHER,
      [],
    ])
  })

  /* The guard: while the list reads the asset it went on to, the detail still holds the one before, behind its
   * loader. Told then, the list read that one again, and it took the place of the asset the user had gone on to. */
  it('leaves the list to the asset it went on to, when the answer comes while that one is read', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.close()
    let showOther: () => void = () => undefined
    server.assetBy(OTHER, () => new Promise((resolve) => (showOther = () => resolve(otherOnServer()))))
    detail.tiles()[1].click()
    await settled()
    await answer()
    showOther()
    await eventually(() => expect(formSays(panel()).file).toBe(OF_OTHER))

    expect([reads(), server.assetReads(OTHER), detail.ui.alerts()]).toEqual([1, 1, []])
  })

  /* The same asset read again while the change is on its way: that read can be answered as the asset was before
   * the change. The list is told once it has landed, and reads the asset once more. */
  it('reads the asset once more when a read of it was on its way as the change was answered', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.close()
    await later()
    const land = holdNextRead()
    detail.tiles()[0].click()
    await settled()
    await answer()
    expect(reads()).toBe(2)
    await land()

    await eventually(() => expect(formSays(panel())).toEqual({ file: SECOND, route: PRIVATE }))
    expect([reads(), detail.ui.alerts()]).toEqual([3, []])
  })

  /* An asset read a moment ago is not read again when it is come back to. After a change of its file it is not as
   * it was read: come back to at once, with the answer given under the read of another asset, it is read anew. */
  it('reads the asset anew when it is come back to at once, the change answered under the read of another', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.close()
    server.assetBy(OTHER, () => new Promise(() => undefined))
    detail.tiles()[1].click()
    await settled()
    await answer()
    detail.tiles()[0].click()

    await eventually(() => expect(formSays(panel())).toEqual({ file: SECOND, route: PRIVATE }))
    expect([reads(), detail.ui.alerts()]).toEqual([2, []])
  })

  /* The guard is of a page that was left, not of one being left: while the list asks whether to leave what was
   * typed it is still there, and "Stay" keeps it. */
  it('shows the route changed in the Info tab while the list asks whether to leave what was typed', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.typeTitle()
    const answer = hold('PATCH', MAKE_PRIVATE, madePrivate)

    await detail.makePrivateInInfo()
    const left = detail.ui.router.push('/settings')
    await settled()
    const question = await eventually(() => {
      const found = Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).find((dialog) =>
        dialog.textContent?.includes(UNSAVED)
      )
      expect(found).toBeTruthy()

      return found!
    })
    await answer()
    await eventually(() => expect(detail.info()).toEqual({ file: FIRST, route: PRIVATE }))
    buttonsNamed(question, 'Stay')[0].click()
    await settled()
    await left

    expect([reads(), detail.title()?.value, detail.ui.alerts()]).toEqual([2, TYPED, []])
  })

  // The guard: the list was left for the page of the same asset, which has read it by the answer.
  it('reads nothing into the page of the asset the list was left for', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
    detail.ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    // Over an open dialog a navigation waits for a timer of the dialog before it goes on.
    const left = detail.ui.router.push('/assets/' + ASSET)
    await settled()
    await left
    await eventually(() => expect(reads()).toBe(2))
    await settled()
    await answer()

    expect([reads(), detail.ui.alerts()]).toEqual([2, []])
  })

  // The guard: the whole read of a page of a detail goes by the address of the page, and the page was left.
  it.each(places.slice(1))('reads nothing once %s was left by the answer', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.openSlots()
    const answer = hold('PATCH', MAIN, madeMain)

    await detail.makeMain('extra')
    await detail.ui.router.push('/settings')
    await answer()

    expect([reads(), detail.ui.alerts()]).toEqual([1, []])
  })
})

/* With metadata typed and not saved, two changes close after each other start two reads of what changed, and the
 * answer of the older can come last: it put back what the newer had replaced. */
describe('two reads of what changed of the file of an asset, the older answered last', () => {
  it('keeps the main file of the newer read', async () => {
    published = new Set([FIRST])
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.typeTitle()
    await detail.openSlots()
    const answerOlder = holdNextRead()

    await detail.makeMain('extra')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))
    await detail.makeMain('default')
    await eventually(() => expect(detail.slot('default').main).toBe(true))
    expect(reads()).toBe(3)
    await answerOlder()
    await detail.openInfo()

    expect([detail.info(), detail.title()?.value]).toEqual([{ file: FIRST, route: PUBLIC }, TYPED])
  })

  it('says nothing of the older read when it failed', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.typeTitle()
    await detail.openSlots()
    const answerOlder = holdNextRead()

    await detail.makePrivateInSlot('default')
    await eventually(() => expect(detail.slot('default').route).toBe(PRIVATE))
    await detail.makeMain('extra')
    await eventually(() => expect(detail.slot('extra').main).toBe(true))
    expect(reads()).toBe(3)
    await answerOlder(false)
    await detail.openInfo()

    expect([detail.info(), detail.ui.alerts()]).toEqual([{ file: SECOND, route: PUBLIC }, []])
  })
})

/* After a change the detail reads the asset whole for, the slots were read twice - by the change, and by the tab as
 * the detail was drawn again - and the answer of the first took the loader of the slots down under the second. */
describe('the slots of an asset, after a change of its main file with nothing typed', () => {
  it.each(places)('are read once after "Make main file", in %s', async (_where, place) => {
    const detail = await openDetail(place)
    await detail.openSlots()
    const slotsRead = server.slotReads(ASSET)

    await detail.makeMain('extra')
    await eventually(() => expect([detail.slot('default').main, detail.slot('extra').main]).toEqual([false, true]))
    await settled()

    expect([reads(), server.slotReads(ASSET) - slotsRead]).toEqual([2, 1])
  })

  it('are read once after a change of the route of the main file in its row', async () => {
    const detail = await openDetail(inTheDialogOfTheList)
    await detail.openSlots()
    const slotsRead = server.slotReads(ASSET)

    await detail.makePrivateInSlot('default')
    await eventually(() => expect(detail.slot('default')).toEqual({ main: true, route: PRIVATE }))
    await settled()

    expect([reads(), server.slotReads(ASSET) - slotsRead]).toEqual([2, 1])
  })

  /* A page of a detail draws no asset once the whole read failed, as the list closes its detail: there is no tab
   * left to read the slots for. */
  it('are not read when the whole read fails on the page of an asset, which draws the asset no more', async () => {
    const detail = await openDetail(onThePageOfTheAsset)
    await detail.openSlots()
    const slotsRead = server.slotReads(ASSET)
    answerRead = () => {
      throw httpError(500)
    }

    await detail.makeMain('extra')
    await eventually(() => expect(detail.ui.alerts()).toEqual([SYSTEM_ERROR]))
    await settled()

    expect([reads(), server.slotReads(ASSET) - slotsRead, detail.slotsDrawn(), detail.title()]).toEqual([
      2,
      0,
      false,
      null,
    ])
  })
})
