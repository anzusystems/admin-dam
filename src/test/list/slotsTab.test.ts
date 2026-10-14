import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The Slots tab of the detail of an asset lists the slots of the asset, each with its file, and the menu of a row
 * changes that file: deletes it, takes it out of the slot, puts it into another, makes it the main file of the asset.
 * The list is kept in one store, for whichever asset the detail holds, and what is asked about the slots of one asset
 * can be answered once the detail holds the next. The real page of the list with its real detail, the application
 * around it as it starts; the server is a fake, and so is the address the page asks about a new version of the
 * application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const SLOT = /^\/adm\/v1\/audio\/([^/]+)\/asset\/([^/]+)\/slot-name\/([^/]+)$/
const FILE = /^\/adm\/v1\/audio\/([^/]+)$/

const LIST = '/assets'
/** The two assets of the list, both audio: the detail goes from the first on to the second. */
const FIRST = 'asset-1'
const SECOND = 'asset-2'
const SLOT_NAMES = ['default', 'free', 'bonus', 'spare', 'extra']

type FileStatus = 'stored' | 'duplicate' | 'processed' | 'failed'

/* What the server holds of each asset: the file of each of its slots by the name of the slot, which of its files is
 * the main one, and how far each file is - processed, unless said otherwise. */
let slots: Record<string, Record<string, string | null>> = {}
let main: Record<string, string> = {}
let fileIs: Record<string, FileStatus> = {}

const fileOf = (assetId: string, fileId: string) => ({
  ...assetFile(fileId, fileIs[fileId] ?? 'processed', { asset: assetId }),
  _resourceName: 'audioFile',
  audioAttributes: { duration: 1000, bitrate: 1000, codecName: 'mp3' },
})

/** An asset as the server holds it now. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'audio', assetStatus: 'with_file' },
    mainFile: fileOf(id, main[id]),
  }),
  keywords: [],
  authors: [],
})

/** The slots of an asset as the server lists them: those that hold a file. */
const slotsOnServer = (assetId: string) => {
  const data = Object.entries(slots[assetId])
    .filter(([, fileId]) => fileId)
    .map(([slotName, fileId]) => ({
      id: 'slot-' + slotName,
      slotName,
      default: slotName === 'default',
      main: fileId === main[assetId],
      assetFile: fileOf(assetId, fileId!),
    }))

  return { data, totalCount: data.length }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the bar of the open detail says: the place of its asset in the list, and the title of the asset. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

/** What a row of the Slots tab says first: the name of its slot, and its file or that it has none. */
const said = (row: HTMLElement) =>
  Array.from(row.querySelectorAll('.v-col:first-child > div'))
    .slice(0, 2)
    .map((line) => line.textContent?.replace(/\s+/g, ' ').trim())
    .join(': ')
/** The rows of the slots; the tab of an audio has one more above them, of the sibling of the asset. */
const slotRows = () =>
  Array.from(detail()?.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8') ?? []).filter(
    (row) => !said(row).startsWith('Sibling')
  )
const slotsShown = () => slotRows().map(said)
const slotRow = (name: string) => slotRows().find((row) => said(row).startsWith(name))!

/** The button that opens the menu of the row of the slot. */
const slotMenuButton = (slotName: string) =>
  slotRow(slotName).querySelector('[data-cy="button-slot-actions"]')!.closest('button')!

/** The item of the menu of the row of the slot, by what it says. */
const slotMenuItem = async (slotName: string, name: string) => {
  slotMenuButton(slotName).click()

  return eventually(() => {
    const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
      (listed) => listed.textContent?.trim() === name
    )
    expect(found).toBeTruthy()

    return found!
  })
}

/** The button of the dialog the item "Remove" of the row opens. */
const removeButton = async (slotName: string, mark: 'button-unset' | 'button-remove') => {
  ;(await slotMenuItem(slotName, 'Remove')).click()

  return eventually(() => {
    const button = document.body.querySelector<HTMLButtonElement>(`.v-dialog [data-cy="${mark}"]`)
    expect(button).not.toBeNull()

    return button!
  })
}

/** "Refresh asset slots" of the tab: it only spins while the slots are read, and can be pressed all the same. */
const refresh = () => buttonsNamed(detail()!, 'Refresh asset slots')[0]

/** The detail goes on to the second asset of the list, by the button of its bar: its Slots tab is drawn with it. */
const goOnToSecond = async () => {
  detail()!.querySelector('.v-toolbar .mdi-chevron-right')!.closest('button')!.click()
  await eventually(() => expect(shown()).toBe('2 / 2 ' + SECOND))
  await eventually(() => expect(slotsShown()).toEqual(OF_SECOND))
}

/* The file is taken out of a slot only once this is let go: the change is sent, and done and answered then. */
const holdUnset = () => {
  let letGo: () => void = () => undefined
  server.on(
    'DELETE',
    SLOT,
    (_request, match) =>
      new Promise<FakeDamAnswer>((resolve) => {
        letGo = () => {
          slots[match[2]][match[3]] = null
          resolve({ status: 204 })
        }
      })
  )

  return () => {
    letGo()

    return settled()
  }
}

/* Every read of the slots of the first asset is held from now on. Let go by the order they were asked in, each
 * answers what the server held as it was asked. */
const holdSlotReads = () => {
  const answers: Array<() => void> = []
  server.slotsBy(FIRST, () => {
    const asRead = slotsOnServer(FIRST)

    return new Promise((resolve) => answers.push(() => resolve(asRead)))
  })

  return (asked: number) => {
    answers[asked]()

    return settled()
  }
}

/** The page of the list with its two assets, the detail of the first opened by the pencil of its tile, on its Slots
 * tab with the rows drawn. */
const openSlots = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_audio_update', 'dam_audio_delete'],
    extSystem: { audio: { slots: SLOT_NAMES } },
    customForm: { audio: [customField('title')] },
  })
  // The user as the bar of the page draws them, and as the picker of the sibling of an audio asks about them.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    adminToExtSystems: [],
    userToExtSystems: [1],
    resolvedAssetLicences: [],
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(2)

    return found
  })
  tiles[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(shown()).toBe('1 / 2 ' + FIRST))
  /** The tab of the detail, by its mark: opened, and what it reads answered. */
  const openTab = async (mark: string) => {
    detail()!.querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
    await settled()
  }
  await openTab('button-slots')
  await eventually(() => expect(slotsShown().length).toBeGreaterThan(0))

  return { ...ui, openTab }
}

const OF_FIRST = ['default (Main file): a-main', 'free: a-two', 'bonus: a-two', 'spare: No file', 'extra: No file']
const OF_SECOND = ['default (Main file): b-main', 'free: No file', 'bonus: b-other', 'spare: No file', 'extra: No file']
/** The first asset once its second file is taken out of the slot "free". */
const FIRST_AFTER = ['default (Main file): a-main', 'free: No file', 'bonus: a-two', 'spare: No file', 'extra: No file']

beforeEach(() => {
  server = createFakeDam()
  slots = {
    [FIRST]: { default: 'a-main', free: 'a-two', bonus: 'a-two', spare: null, extra: null },
    [SECOND]: { default: 'b-main', free: null, bonus: 'b-other', spare: null, extra: null },
  }
  main = { [FIRST]: 'a-main', [SECOND]: 'b-main' }
  fileIs = {}
  const listed = [FIRST, SECOND]
  for (const id of listed) {
    server.assetBy(id, () => onServer(id))
    server.slotsBy(id, () => slotsOnServer(id))
  }
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: listed.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // As core-dam answers them: 204 for a file taken out of a slot that holds it, and for a file deleted.
  server.on('DELETE', SLOT, (_request, match) => {
    if (slots[match[2]][match[3]] !== match[1]) throw httpError(404)
    slots[match[2]][match[3]] = null

    return { status: 204 }
  })
  server.on('DELETE', FILE, (_request, match) => {
    for (const of of Object.values(slots)) {
      for (const slotName of Object.keys(of)) if (of[slotName] === match[1]) of[slotName] = null
    }

    return { status: 204 }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* A change of a slot ends in a read of the slots, and so does "Refresh asset slots". Answered once the detail had
 * gone on to the next asset of the list, the read was written all the same: the Slots tab of that asset listed the
 * slots of the one before, and the menu of a row deleted a file of the asset before. */
describe('the Slots tab of an asset the detail went on to, while the slots of the one before were asked about', () => {
  it('keeps its own rows when a change of a slot of the asset before is answered only now', async () => {
    const answerChange = holdUnset()
    const ui = await openSlots()
    expect(slotsShown()).toEqual(OF_FIRST)
    ;(await removeButton('free', 'button-unset')).click()
    await settled()
    expect(server.sent('DELETE', SLOT).map((request) => request.url)).toEqual([
      '/adm/v1/audio/a-two/asset/asset-1/slot-name/free',
    ])

    await goOnToSecond()
    const slotsReadOfFirst = server.slotReads(FIRST)
    await answerChange()

    // Nor is the tab left spinning: what was asked for the asset before waits for nothing here.
    expect([slotsShown(), server.slotReads(FIRST) - slotsReadOfFirst, ui.alerts()]).toEqual([OF_SECOND, 0, []])

    // The menu of a row is of the file the row shows: a file of this asset.
    ;(await removeButton('bonus', 'button-remove')).click()
    await eventually(() => expect(slotsShown()[2]).toBe('bonus: No file'))
    expect(server.sent('DELETE', FILE).map((request) => request.url)).toEqual(['/adm/v1/audio/b-other'])
  })

  it('keeps its own rows when a read of the slots of the asset before is answered only now', async () => {
    const ui = await openSlots()
    const answerRead = holdSlotReads()
    refresh().click()
    await settled()

    await goOnToSecond()
    await answerRead(0)

    expect([slotsShown(), ui.alerts()]).toEqual([OF_SECOND, []])
  })
})

/* "Refresh asset slots" only spins while the slots are read, and a key pressed on it reads them again: two reads of
 * the slots of one asset, answered in whatever order. */
describe('two reads of the slots of one asset', () => {
  it('shows what the later of them brought when the older is answered last', async () => {
    await openSlots()
    const answerRead = holdSlotReads()
    const button = refresh()

    button.click()
    await settled()
    // Changed meanwhile, from elsewhere: the second read is of the slots as they are now.
    slots[FIRST].free = null
    button.click()
    await settled()
    await answerRead(1)
    expect(slotsShown()).toEqual(FIRST_AFTER)
    await answerRead(0)

    expect(slotsShown()).toEqual(FIRST_AFTER)
  })

  it('waits for the later of them when the older is answered first, and shows what that one brought', async () => {
    await openSlots()
    const answerRead = holdSlotReads()
    const button = refresh()

    button.click()
    await settled()
    slots[FIRST].free = null
    button.click()
    await settled()
    await answerRead(0)

    // Still read: no rows are drawn of an answer something was asked after.
    expect(slotsShown()).toEqual([])
    await answerRead(1)
    expect(slotsShown()).toEqual(FIRST_AFTER)
  })
})

/* The guard: the tab can be left and come back to while a change is on its way. The tab drawn then has read the
 * slots as they were before the change, and the read that follows the change is the one that brings them as they
 * are after it. */
describe('a change of a slot answered once its tab was left and opened again', () => {
  it('shows the slots as they are after the change', async () => {
    const answerChange = holdUnset()
    const ui = await openSlots()
    ;(await removeButton('free', 'button-unset')).click()
    await settled()

    await ui.openTab('button-meta')
    await ui.openTab('button-slots')
    await eventually(() => expect(slotsShown()).toEqual(OF_FIRST))
    await answerChange()

    await eventually(() => expect(slotsShown()).toEqual(FIRST_AFTER))
    expect(ui.alerts()).toEqual([])
  })
})

/* The server makes any file of an asset its main one. One that failed, is a duplicate or is still on its way has no
 * picture to show, and with a main file not yet processed the form of an asset that is not described cannot be
 * saved. */
describe('"Make main file" in the menu of a row of the Slots tab', () => {
  it('is offered only for a file the server has processed', async () => {
    slots[FIRST] = { default: 'a-main', free: 'a-two', bonus: 'a-stored', spare: 'a-failed', extra: 'a-duplicate' }
    fileIs = { 'a-stored': 'stored', 'a-failed': 'failed', 'a-duplicate': 'duplicate' }
    await openSlots()
    expect(slotRows()).toHaveLength(5)

    const offered: Record<string, boolean> = {}
    for (const slotName of SLOT_NAMES) {
      const button = slotMenuButton(slotName)
      button.click()
      const items = await eventually(() => {
        const listed = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).map((item) =>
          item.textContent?.trim()
        )
        // The menu of every row has "Download".
        expect(listed).toContain('Download')

        return listed
      })
      offered[slotName] = items.includes('Make main file')
      button.click()
      await eventually(() => expect(menu()).toBeNull())
    }

    // Not for the main file itself either, as ever.
    expect(offered).toEqual({ default: false, free: true, bonus: false, spare: false, extra: false })
  })
})
