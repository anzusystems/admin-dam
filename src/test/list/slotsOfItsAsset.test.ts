import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The slots of an asset are read into one list, for whichever asset the detail holds: the Slots tab draws its rows
 * from it, and the select of a slot above a card or in a dialog of the detail lists its slots. A read of the slots of
 * the asset the detail went on to can fail, and the list held the slots of the asset before then; and a read that
 * follows a change of a slot can be answered after the detail went on and came back. The real page of the list with
 * its real detail, the application around it as it starts; the server is a fake, and so is the address the page asks
 * about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const SLOT = /^\/adm\/v1\/video\/([^/]+)\/asset\/([^/]+)\/slot-name\/([^/]+)$/

const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const LIST = '/assets'
/** The two videos of the list: the detail goes from the first on to the second, and back. */
const FIRST = 'asset-1'
const SECOND = 'asset-2'
const SLOT_NAMES = ['default', 'extra', 'spare']

/* What the server holds of each video: the file of each of its slots by the name of the slot, the first one main. A
 * file in two slots can be taken out of one of them. */
let slots: Record<string, Record<string, string | null>> = {}

const fileOf = (assetId: string, fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: assetId }),
  _resourceName: 'videoFile',
  videoAttributes: { duration: 1000, bitrate: 1000, codecName: 'h264' },
  imagePreview: null,
})

const mainOf = (assetId: string) => slots[assetId].default!

/** A video as the server holds it now. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: 'video', assetStatus: 'with_file' },
    mainFile: fileOf(id, mainOf(id)),
  }),
  keywords: [],
  authors: [],
})

/** The slots of a video as the server lists them: those that hold a file. */
const slotsOnServer = (assetId: string) => {
  const data = Object.entries(slots[assetId])
    .filter(([, fileId]) => fileId)
    .map(([slotName, fileId]) => ({
      id: 'slot-' + slotName,
      slotName,
      default: slotName === 'default',
      main: fileId === mainOf(assetId),
      assetFile: fileOf(assetId, fileId!),
    }))

  return { data, totalCount: data.length }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const content = () => detail()!.querySelector<HTMLElement>('.sidebar-info__content')!

/** What the bar of the open detail says: the place of its asset in the list, and the title of the asset. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

/** What a row of the Slots tab says first: the name of its slot, and its file or that it has none. */
const said = (row: HTMLElement) =>
  Array.from(row.querySelectorAll('.v-col:first-child > div'))
    .slice(0, 2)
    .map((line) => line.textContent?.replace(/\s+/g, ' ').trim())
    .join(': ')
/** The rows of the slots; the tab of a video has one more above them, of the sibling of the asset. */
const slotRows = () =>
  Array.from(detail()?.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8') ?? []).filter(
    (row) => !said(row).startsWith('Sibling')
  )
const slotsShown = () => slotRows().map(said)
/** How many rows have a menu: only a row of a file has one. */
const menus = () => content().querySelectorAll('[data-cy="button-slot-actions"]').length
const spins = () => !!content().querySelector('.v-progress-circular')

/** The detail goes to the asset beside the one it holds, by the arrow of its bar, and has read what it reads. */
const goTo = async (arrow: 'right' | 'left', place: string) => {
  detail()!.querySelector(`.v-toolbar .mdi-chevron-${arrow}`)!.closest('button')!.click()
  await eventually(() => expect(shown()).toBe(place))
  await settled()
}

/* Every text put into the page from now on, as it is put there: a row drawn only until the loader of the slots goes
 * up, within the same tick, is seen too. Vue puts every element it draws by `insertBefore`, the rows of a tab within
 * the tab, before the tab goes into the page. */
let insertBefore: typeof Node.prototype.insertBefore | null = null
const drawnFromNow = () => {
  const drawn: string[] = []
  const insert = Node.prototype.insertBefore
  insertBefore = insert
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null) {
    const inserted = insert.call(this, node, child) as T
    if (this.isConnected) drawn.push(node.textContent ?? '')

    return inserted
  }

  return drawn
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

/** "Remove" of the row of the slot "extra", and in its dialog "Unset": the file is in the slot "spare" too. */
const unsetExtra = async () => {
  content().querySelectorAll<HTMLElement>('[data-cy="button-slot-actions"]')[1].closest('button')!.click()
  const item = await eventually(() => {
    const found = Array.from(
      document.body.querySelectorAll<HTMLElement>('.v-menu.v-overlay--active .v-list-item')
    ).find((listed) => listed.textContent?.trim() === 'Remove')
    expect(found).toBeTruthy()

    return found!
  })
  item.click()
  const unset = await eventually(() => {
    const button = document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-unset"]')
    expect(button).not.toBeNull()

    return button!
  })
  unset.click()
  await settled()
}

/* Every read of the slots of the first video is held from now on. Let go by the order they were asked in: answered
 * with what the server held as it was asked, or failed. */
const holdSlotReads = () => {
  const answers: Array<(went: boolean) => void> = []
  server.slotsBy(FIRST, () => {
    const asRead = slotsOnServer(FIRST)

    return new Promise((resolve, reject) => answers.push((went) => (went ? resolve(asRead) : reject(httpError(500)))))
  })

  return (asked: number, went = true) => {
    answers[asked](went)

    return settled()
  }
}

/** The read of the slots of the second video fails from now on, as the server is away. */
const slotsOfSecondFail = () =>
  server.slotsBy(SECOND, () => {
    throw httpError(500)
  })

/** The page of the list with its two videos, the detail of the first opened by the pencil of its tile, on its tab. */
const openDetailOn = async (mark: string) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_video_update', 'dam_video_delete'],
    extSystem: { video: { slots: SLOT_NAMES } },
    customForm: { video: [customField('title')] },
  })
  // The user as the bar of the page draws them, and as the picker of the sibling of a video asks about them.
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
  detail()!.querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
  await settled()

  return ui
}

/** The detail of the first video on its Slots tab, with its rows drawn. */
const openSlots = async () => {
  const ui = await openDetailOn('button-slots')
  await eventually(() => expect(slotsShown()).toEqual(OF_FIRST))

  return ui
}

const OF_FIRST = ['default (Main file): a-main', 'extra: a-two', 'spare: a-two']
const OF_SECOND = ['default (Main file): b-main', 'extra: b-other', 'spare: No file']
/** The first video once its second file is taken out of the slot "extra". */
const FIRST_AFTER = ['default (Main file): a-main', 'extra: No file', 'spare: a-two']
/** What the tab draws with no slots read: every slot with no file, and no menu. */
const NONE_READ = ['default: No file', 'extra: No file', 'spare: No file']

beforeEach(() => {
  server = createFakeDam()
  slots = {
    [FIRST]: { default: 'a-main', extra: 'a-two', spare: 'a-two' },
    [SECOND]: { default: 'b-main', extra: 'b-other', spare: null },
  }
  const listed = [FIRST, SECOND]
  for (const id of listed) {
    server.assetBy(id, () => onServer(id))
    server.slotsBy(id, () => slotsOnServer(id))
    // Each file of the video, as the card of its preview image reads it.
    for (const fileId of Object.values(slots[id])) if (fileId) server.fileBy('video', fileId, () => fileOf(id, fileId))
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
  // As core-dam answers it: 204 for a file taken out of a slot that holds it.
  server.on('DELETE', SLOT, (_request, match) => {
    if (slots[match[2]][match[3]] !== match[1]) throw httpError(404)
    slots[match[2]][match[3]] = null

    return { status: 204 }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  if (insertBefore) Node.prototype.insertBefore = insertBefore
  insertBefore = null
  stopUploadUi()
})

/* The list of the slots held the slots of the asset before, until the read of the slots of the next one wrote over
 * it: drawn for a moment as the tab of the next asset was drawn, and for good when that read failed - with the menus
 * of the rows, which deleted the file of a row, or put it into a slot of the asset of the tab. */
describe('the Slots tab of the asset the detail went on to', () => {
  it('draws no row of the asset before, not even for the moment it is drawn', async () => {
    await openSlots()
    const drawn = drawnFromNow()

    await goTo('right', '2 / 2 ' + SECOND)
    await eventually(() => expect(slotsShown()).toEqual(OF_SECOND))

    expect(drawn.filter((text) => /a-main|a-two/.test(text))).toEqual([])
  })

  it('draws no row of the asset before when its own read of the slots fails: every slot with no file, no menu', async () => {
    const ui = await openSlots()
    slotsOfSecondFail()

    await goTo('right', '2 / 2 ' + SECOND)
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    await eventually(() => expect(spins()).toBe(false))

    expect([slotsShown(), menus(), ui.alerts()]).toEqual([NONE_READ, 0, [SYSTEM_ERROR]])
  })
})

/* The select of a slot above the card of the preview image of a video reads the slots as it is drawn, and lists them
 * from the same list: after a failed read it listed the slots of the asset before, and the slot picked in it was read
 * into the card - a file of that asset, which the image picked in the card was saved for. */
describe('the select of a slot of the asset the detail went on to', () => {
  it('lists no slot of the asset before when its own read of the slots fails', async () => {
    const ui = await openDetailOn('button-image-preview')
    const select = () => content().querySelector<HTMLElement>('.v-select')!
    await eventually(() => expect(select().querySelector('.v-select__selection')?.textContent?.trim()).toBe('default'))
    slotsOfSecondFail()
    const filesReadBefore = server.sent('GET', /^\/adm\/v1\/video\/a-/).length

    await goTo('right', '2 / 2 ' + SECOND)
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    await settled()

    // Nothing to pick: no slot of this video was read, and none of the one before is offered.
    expect([
      select().classList.contains('v-input--disabled'),
      select().querySelector('.v-select__selection')?.textContent?.trim() ?? '',
      server.sent('GET', /^\/adm\/v1\/video\/a-/).length - filesReadBefore,
    ]).toEqual([true, '', 0])
  })
})

/* A change of a slot ends in a read of its slots by the tab it was made in, and the tab drawn when the detail comes
 * back to the asset reads them too: the read asked for last is the one that counts. When it failed, the list still
 * held the slots of the asset the detail had been on meanwhile. */
describe('the Slots tab of an asset the detail came back to while a change of its slot was on its way', () => {
  it('draws no row of the asset it came back from when the read that follows the change fails', async () => {
    const answerChange = holdUnset()
    const ui = await openSlots()
    await unsetExtra()
    expect(server.sent('DELETE', SLOT)).toHaveLength(1)

    await goTo('right', '2 / 2 ' + SECOND)
    await eventually(() => expect(slotsShown()).toEqual(OF_SECOND))
    const answerRead = holdSlotReads()
    await goTo('left', '1 / 2 ' + FIRST)
    const readsOfFirst = server.slotReads(FIRST)
    // The change is answered: the tab it was made in reads the slots after it, later than the tab drawn now.
    await answerChange()
    expect(server.slotReads(FIRST)).toBe(readsOfFirst + 1)

    await answerRead(0)
    await answerRead(1, false)
    await eventually(() => expect(spins()).toBe(false))

    expect([slotsShown(), menus(), ui.alerts()]).toEqual([NONE_READ, 0, [SYSTEM_ERROR]])
  })
})

/* The list is of the asset it was last read for: a read that follows a change is written while the detail holds that
 * asset again, after the select of a slot of another one was drawn meanwhile. The Slots tab of that other one drawn
 * next held the rows of the first. */
describe('the Slots tab of an asset whose slots were read before those of another were written', () => {
  it('draws no row of the other asset when its own read of the slots fails', async () => {
    const answerChange = holdUnset()
    const ui = await openSlots()
    await unsetExtra()
    // The select of a slot of the first video, and of the second, each drawn by the tab of the preview image.
    detail()!.querySelector<HTMLElement>('[data-cy="button-image-preview"]')!.click()
    await settled()
    await goTo('right', '2 / 2 ' + SECOND)
    await eventually(() => expect(server.slotReads(SECOND)).toBe(1))
    // Back on the first video, with nothing drawn that reads its slots, as its change is answered.
    detail()!.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await settled()
    await goTo('left', '1 / 2 ' + FIRST)
    const readsOfFirst = server.slotReads(FIRST)
    await answerChange()
    expect(server.slotReads(FIRST)).toBe(readsOfFirst + 1)

    slotsOfSecondFail()
    await goTo('right', '2 / 2 ' + SECOND)
    detail()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    await eventually(() => expect(spins()).toBe(false))

    expect([slotsShown(), menus()]).toEqual([NONE_READ, 0])
  })
})

/* A change of a slot goes one at a time: a second one is refused over the first, which went through. The loader of
 * the slots held it back, and the read of the slots by the tab drawn again took the loader down under the change:
 * its rows and their menus were back, and the same item sent the change a second time. */
describe('the Slots tab drawn again while a change of its slot is on its way', () => {
  it('sends the change once, however its item is pressed again', async () => {
    const answerChange = holdUnset()
    await openDetailOn('button-slots')
    await eventually(() => expect(slotsShown()).toEqual(OF_FIRST))
    await unsetExtra()

    detail()!.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await settled()
    detail()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    await eventually(() => expect(slotsShown()).toEqual(OF_FIRST))
    await unsetExtra()
    await settled()
    expect(server.sent('DELETE', SLOT)).toHaveLength(1)

    await answerChange()
    await eventually(() => expect(slotsShown()).toEqual(FIRST_AFTER))
    expect(server.sent('DELETE', SLOT)).toHaveLength(1)
  })
})
