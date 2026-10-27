import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/file-1\/make-private$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const EDIT_MORE = 'Edit more'

const RIGHT = 'ArrowRight'

const LIST = '/assets'
const SETTINGS = '/settings'
const UPLOADED = 'asset-9'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const PUBLISHED = { id: 'route-1', publicUrl: 'https://dam.test/public/file-1' }
const image = (mainRoute: typeof PUBLISHED | null) =>
  onServer('asset-2', {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    mainFile: { ...assetFile('file-1', 'processed', { asset: 'asset-2' }), mainRoute },
  })

let listed: ReturnType<typeof onServer>[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

/** Moves past the few seconds in which an asset read a moment ago is not read again. */
const later = () => vi.advanceTimersByTimeAsync(6_000)

const arrow = async (over: Element) => {
  over.dispatchEvent(new KeyboardEvent('keyup', { key: RIGHT, bubbles: true }))
  await settled()
}

const reads = () => ['asset-1', 'asset-2', 'asset-3', UPLOADED].map((assetId) => server.assetReads(assetId))

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )
const answer = async (name: typeof STAY | typeof LEAVE) => {
  buttonsNamed(questions()[0], name)[0].click()
  await settled()
}

const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: [queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' })] },
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
  ui.router.addRoute({ path: SETTINGS, component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(listed.length))
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

  return {
    ...ui,
    page,
    tiles,
    queue,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')!,
    save: () => buttonsNamed(panel(), 'Save')[0],
    reload: async () => {
      buttonsNamed(page, 'Reload list')[0].click()
      await settled()
    },
    makePrivate: async () => {
      panel().querySelector('.mdi-dots-vertical')!.closest('button')!.click()
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
    editRowOfUploadQueue: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      await eventually(() => expect(queue()).not.toBeNull())
      const edit = await eventually(() => {
        const button = buttonsNamed(queue()!, EDIT_MORE)[0]
        expect(button?.disabled).toBe(false)

        return button
      })
      edit.click()
      await settled()
    },
    openMassEdit: async (index: number) => {
      tiles()[index].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
      const open = await eventually(() => {
        const footer = document.body.querySelector('.asset-footer__selected')
        const button = footer ? buttonsNamed(footer, 'Edit')[0] : undefined
        expect(button).toBeTruthy()

        return button!
      })
      open.click()
      await eventually(() => expect(queue()).not.toBeNull())
    },
    detail: () => {
      const dialog = dialogOfList()
      if (!dialog) return null

      return Array.from(dialog.querySelectorAll('.v-toolbar .text-label-large > div'))
        .map((part) => part.textContent?.trim())
        .join(' ')
    },
    address: () => ui.router.currentRoute.value.path,
  }
}

type List = Awaited<ReturnType<typeof openList>>

const typeInto = async (field: HTMLTextAreaElement) => {
  field.value = TYPED
  field.dispatchEvent(new Event('input'))
  await nextTick()
}

const typedIntoTheSecond = async (list: List) => {
  await list.pick(1)
  await typeInto(list.title())

  return list.title()
}

const typedIsKept = (list: List, typedInto: HTMLTextAreaElement) =>
  expect([list.title() === typedInto, typedInto.isConnected, typedInto.value, standsOut(list.save())]).toEqual([
    true,
    true,
    TYPED,
    true,
  ])

const holdSaveToFail = () => {
  let fail: () => void = () => undefined
  server.on(
    'PATCH',
    BULK,
    () => new Promise<FakeDamAnswer>((_resolve, reject) => (fail = () => reject(httpError(500))))
  )

  return () => {
    fail()

    return settled()
  }
}

beforeEach(() => {
  server = createFakeDam()
  listed = ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id))
  listed.forEach((asset) => server.asset(asset))
  server.asset(
    onServer(UPLOADED, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
    })
  )
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: listed.map((asset) => structuredClone(asset)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', MAKE_PRIVATE, () => ({ status: 204 }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/*
 * The keys were not heard over any input of the page.
 * A panel switch holding the focus caught them, though they do nothing to it.
 */
describe('the arrow keys of the list, with the detail closed', () => {
  it('walk the list when let go over a switch of the panel, and not over its title', async () => {
    const list = await openList()
    await list.pick(1)

    await arrow(list.title())
    expect([list.active(), reads()]).toEqual([
      [false, true, false],
      [0, 1, 0, 0],
    ])

    const singleUse = panel().querySelector<HTMLInputElement>('.v-switch input')!
    singleUse.focus()
    await arrow(singleUse)

    expect([list.active(), reads()]).toEqual([
      [false, false, true],
      [0, 1, 1, 0],
    ])
  })

  it('walk nothing under an open menu of the page, and the list once it is closed', async () => {
    const list = await openList()
    await list.pick(1)
    list.page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    await eventually(() => expect(menu()).not.toBeNull())

    await arrow(document.body)
    expect([list.active(), reads()]).toEqual([
      [false, true, false],
      [0, 1, 0, 0],
    ])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await eventually(() => expect(menu()).toBeNull())
    await arrow(document.body)
    expect([list.active(), reads()]).toEqual([
      [false, false, true],
      [0, 1, 1, 0],
    ])
  })
})

/*
 * What a save on its way took of the form is not saved until the server says so.
 * If it fails, the form is as unsaved as before, unless the asset was left meanwhile.
 */
describe('metadata typed into the panel while their save is on its way', () => {
  it('are asked about by a click on another tile: "Stay" keeps them, and the save that fails leaves them unsaved', async () => {
    const fail = holdSaveToFail()
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    list.save().click()
    await settled()
    expect(server.sent('PATCH', BULK)).toHaveLength(1)

    await list.pick(2)

    expect([questions().length, list.active(), reads()]).toEqual([1, [false, true, false], [0, 1, 0, 0]])
    await answer(STAY)
    await fail()
    expect(list.alerts()).toEqual([SYSTEM_ERROR])
    typedIsKept(list, typedInto)
    await list.pick(2)
    expect([questions().length, reads()]).toEqual([1, [0, 1, 0, 0]])
  })

  it('go with "Leave anyway": the tile is read, and the save that fails after that asks about nothing', async () => {
    const fail = holdSaveToFail()
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await settled()

    await list.pick(2)
    expect(questions()).toHaveLength(1)
    await answer(LEAVE)
    await fail()

    expect([list.active(), reads(), list.title().value, standsOut(list.save())]).toEqual([
      [false, false, true],
      [0, 1, 1, 0],
      FROM_SERVER,
      false,
    ])
    await list.pick(0)
    expect([questions(), list.active()]).toEqual([[], [true, false, false]])
  })

  /*
   * The detail opened over the form while the panel save was on its way saved what it holds.
   * A panel save failing after that has nothing left to call unsaved.
   */
  it('are not called unsaved again by a save of the panel that fails after the detail saved them', async () => {
    let fail: () => void = () => undefined
    let first = true
    server.on('PATCH', BULK, (request) => {
      if (!first) return { status: 200, data: JSON.parse(request.data as string) }
      first = false

      return new Promise<FakeDamAnswer>((_resolve, reject) => (fail = () => reject(httpError(500))))
    })
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await settled()
    list.pencil(1).click()
    await eventually(() => expect(list.detail()).toBe('2 / 3 asset-2'))
    dialogOfList()!.querySelector<HTMLButtonElement>('[data-cy="button-save"]')!.click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    dialogOfList()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
    await eventually(() => expect(dialogOfList()).toBeNull())

    fail()
    await settled()

    expect([list.alerts(), list.title().value, standsOut(list.save())]).toEqual([[UPDATED, SYSTEM_ERROR], TYPED, false])
    await list.pick(2)
    expect([questions(), list.active(), reads()]).toEqual([[], [false, false, true], [0, 1, 1, 0]])
  })
})

/*
 * In a browser the second click of a double click, and the double
 * click itself, land on the question its first click opened.
 * "Leave anyway" then only picked the tile, and the detail had to be opened again.
 */
describe('a double click on another tile under metadata typed into the panel', () => {
  it('asks once, and "Leave anyway" opens the detail of the tile also when the rest of it lands on the question', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)

    list.tiles()[2].click()
    await settled()
    const question = questions()[0]
    question.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    question.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await settled()

    expect([questions().length, list.active(), list.detail(), reads()]).toEqual([
      1,
      [false, true, false],
      null,
      [0, 1, 0, 0],
    ])
    await answer(LEAVE)
    expect([questions(), list.active(), list.detail(), reads()]).toEqual([
      [],
      [false, false, true],
      '3 / 3 asset-3',
      [0, 1, 1, 0],
    ])
  })
})

/*
 * A double click inside the question, after a single click on a tile raised it, is not a double click of the tile.
 * The user may be selecting a word or pressing a button twice.
 */
describe('a double click inside the question a click on another tile raised', () => {
  it('leaves "Leave anyway" to pick the tile only', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    list.tiles()[2].click()
    await settled()

    questions()[0]
      .querySelector('.v-overlay__content .v-card-text')!
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await settled()
    await answer(LEAVE)

    expect([questions(), list.active(), list.detail(), reads()]).toEqual([[], [false, false, true], null, [0, 1, 1, 0]])
  })
})

/*
 * A double click whose second click lands inside the question card is not a double click of the tile either.
 * The browser sends it to an element that holds both the tile and the card.
 */
describe('a double click begun on another tile and ended inside the question its click raised', () => {
  it('leaves "Leave anyway" to pick the tile only', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    list.tiles()[2].click()
    await settled()

    const card = questions()[0].querySelector('.v-overlay__content .v-card-text')!
    card.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    document.body.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await settled()
    await answer(LEAVE)

    expect([questions(), list.active(), list.detail(), reads()]).toEqual([[], [false, false, true], null, [0, 1, 1, 0]])
  })
})

/*
 * A queue row that the answer removed from its queue is no longer opened.
 * The edit pressed in it was for a row nobody sees.
 */
describe('the edit of a row of the upload queue under metadata typed into the panel', () => {
  it('reads and opens nothing after "Leave anyway" when the row has gone from its queue meanwhile', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    await list.editRowOfUploadQueue()
    expect(questions()).toHaveLength(1)

    list.store.queues.global.items.splice(0, 1)
    await settled()
    await answer(LEAVE)

    expect([questions(), dialogOfList(), reads()]).toEqual([[], null, [0, 1, 0, 0]])
    typedIsKept(list, typedInto)
  })
})

/*
 * A bulk save of the asset the panel holds first asks about
 * what was typed into the panel (`massEditAsksPanel.test.ts`).
 * "Leave anyway" saves it, and the asset is read whole into the panel behind its loader.
 * What was typed is given up then, so a way to another asset behind that loader asks nothing.
 */
describe('metadata typed into the panel while the mass edit saves the same asset', () => {
  it('are asked about by the save; after "Leave anyway" a click on another tile behind the loader of the read asks nothing', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.openMassEdit(1)
    let answerRead: () => void = () => undefined
    server.assetBy('asset-2', () => new Promise((resolve) => (answerRead = () => resolve(onServer('asset-2')))))
    const saveAndFinish = await eventually(() => {
      const button = buttonsNamed(list.queue()!, 'Save and finish')[0]
      expect(button?.disabled).toBe(false)

      return button
    })
    saveAndFinish.click()
    await settled()
    expect([questions().length, server.sent('PATCH', BULK).length]).toEqual([1, 0])
    await answer(LEAVE)
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    await eventually(() => expect(list.queue()).toBeNull())
    expect(panel().querySelector('.v-progress-circular')).not.toBeNull()

    await list.pick(2)

    expect([questions(), list.active(), reads()[2]]).toEqual([[], [false, false, true], 1])
    answerRead()
    await settled()
    expect([questions(), list.title().value, standsOut(list.save())]).toEqual([[], FROM_SERVER, false])
  })
})

/*
 * A form save sent before its asset was marked as being deleted,
 * and failing after that, called what it took unsaved again.
 * The next way elsewhere then asked about metadata that have nowhere to be saved.
 */
describe('metadata typed into the panel and saved just before their asset is deleted', () => {
  it('are not called unsaved again when that save fails after the delete', async () => {
    const fail = holdSaveToFail()
    server.on('DELETE', /^\/adm\/v1\/asset\/asset-2$/, () => ({ status: 204 }))
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await settled()
    list.pencil(1).click()
    await eventually(() => expect(list.detail()).toBe('2 / 3 asset-2'))
    buttonsNamed(dialogOfList()!, 'Delete')[0].click()
    const confirm = await eventually(() => {
      const button = document.body.querySelector<HTMLButtonElement>('[data-cy="button-confirm-delete"]')
      expect(button).not.toBeNull()

      return button!
    })
    confirm.click()
    await eventually(() => expect(dialogOfList()).toBeNull())
    const windowAsks = () => {
      const going = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(going)

      return going.defaultPrevented
    }
    expect([standsOut(list.save()), windowAsks()]).toEqual([false, false])

    await fail()

    expect([standsOut(list.save()), windowAsks()]).toEqual([false, false])
    await list.pick(2)
    expect([questions(), list.active()]).toEqual([[], [false, false, true]])
  })
})

describe('"Edit more" of the panel', () => {
  it('reads the asset of the panel into the detail when nothing typed waits to be saved', async () => {
    const list = await openList()
    await list.pick(1)
    await later()

    buttonsNamed(panel(), EDIT_MORE)[0].click()
    await settled()

    await eventually(() => expect(list.detail()).toBe('2 / 3 asset-2'))
    expect(reads()).toEqual([0, 2, 0, 0])
  })

  it('reads nothing over metadata typed into the panel: the detail opens over them', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    await later()

    buttonsNamed(panel(), EDIT_MORE)[0].click()
    await settled()

    await eventually(() => expect(list.detail()).toBe('2 / 3 asset-2'))
    expect([reads(), dialogOfList()!.querySelector<HTMLTextAreaElement>('textarea')!.value]).toEqual([
      [0, 1, 0, 0],
      TYPED,
    ])
    expect(typedInto.value).toBe(TYPED)
  })
})

/*
 * The tile of the asset the panel holds is the active one in a list read anew.
 * While that asset is read again, the panel holds it all the same.
 */
describe('the active tile over a list read anew', () => {
  it('waits for its asset also through a list that comes while the panel reads that asset again', async () => {
    const [first, , third] = listed
    listed = [first, image(PUBLISHED), third]
    server.asset(image(PUBLISHED))
    const list = await openList()
    await list.pick(1)
    listed = [first, third]
    await list.reload()
    expect(list.active()).toEqual([false, false])
    let answerRead: () => void = () => undefined
    server.assetBy('asset-2', () => new Promise((resolve) => (answerRead = () => resolve(image(null)))))
    await list.makePrivate()
    expect(panel().querySelector('.v-progress-circular')).not.toBeNull()

    listed = [first, image(null), third]
    await list.reload()

    expect(list.active()).toEqual([false, true, false])
    answerRead()
    await settled()
    expect(list.active()).toEqual([false, true, false])
  })

  it('is the very tile that was clicked when its asset is listed twice', async () => {
    const [first, second] = listed
    listed = [first, second, first]
    const list = await openList()
    await list.pick(2)
    expect(list.active()).toEqual([false, false, true])

    await list.reload()

    expect(list.active()).toEqual([false, false, true])
  })
})

/*
 * The page asks before it is left with unsaved typed metadata. Meanwhile a request it sent can fail.
 * Its error belongs to the page, which is still there once the question is answered "Stay".
 */
describe('a read that fails under the question whether to leave the page', () => {
  it.each<[string, typeof STAY | typeof LEAVE, string[], string]>([
    ['"Stay"', STAY, [SYSTEM_ERROR], LIST],
    ['"Leave anyway"', LEAVE, [], SETTINGS],
  ])('says so after %s only while the page is there', async (_answered, answered, alerts, at) => {
    const [first, , third] = listed
    listed = [first, image(PUBLISHED), third]
    server.asset(image(PUBLISHED))
    const list = await openList()
    await typedIntoTheSecond(list)
    let failRead: () => void = () => undefined
    server.assetBy('asset-2', () => new Promise((_resolve, reject) => (failRead = () => reject(httpError(500)))))
    await list.makePrivate()
    await eventually(() => expect(server.assetReads('asset-2')).toBe(2))

    void list.router.push(SETTINGS)
    await settled()
    expect(questions()).toHaveLength(1)
    failRead()
    await settled()
    expect(list.alerts()).toEqual([])

    await answer(answered)

    expect([list.alerts(), list.address()]).toEqual([alerts, at])
  })

  /*
   * A given up way back is undone by the browser only after the router said so, by a popstate that may never come.
   * Here the router history is left elsewhere, as it is meanwhile. The error waited for that popstate forever.
   */
  it('says so after "Stay" a moment later when the history is not back on the page by then', async () => {
    const [first, , third] = listed
    listed = [first, image(PUBLISHED), third]
    server.asset(image(PUBLISHED))
    const list = await openList()
    await typedIntoTheSecond(list)
    let failRead: () => void = () => undefined
    server.assetBy('asset-2', () => new Promise((_resolve, reject) => (failRead = () => reject(httpError(500)))))
    await list.makePrivate()
    await eventually(() => expect(server.assetReads('asset-2')).toBe(2))
    void list.router.push(SETTINGS)
    await settled()
    failRead()
    await settled()
    list.router.options.history.replace(SETTINGS)

    await answer(STAY)
    expect(list.alerts()).toEqual([])
    await vi.advanceTimersByTimeAsync(1_000)

    expect([list.alerts(), list.address()]).toEqual([[SYSTEM_ERROR], LIST])
  })
})

/*
 * A file change answered under a read of the asset waits for that read and
 * reads it again. A bulk save answered meanwhile waits for the same read.
 * That read took the place of the one of the change, and when it failed only the console heard of it.
 */
describe('the change of the file of the asset of the panel, and a bulk save of it, both answered under a read of it', () => {
  it('say so when the read of the asset after them fails', async () => {
    const [first, , third] = listed
    listed = [first, image(PUBLISHED), third]
    server.asset(image(PUBLISHED))
    const list = await openList()
    await list.pick(1)
    list.tiles()[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    const editOfStrip = await eventually(() => {
      const footer = document.body.querySelector('.asset-footer__selected')
      const button = footer ? buttonsNamed(footer, 'Edit')[0] : undefined
      expect(button).toBeTruthy()

      return button!
    })
    await later()
    let madePrivate: () => void = () => undefined
    server.on(
      'PATCH',
      MAKE_PRIVATE,
      () => new Promise<FakeDamAnswer>((resolve) => (madePrivate = () => resolve({ status: 204 })))
    )
    await list.makePrivate()
    let answerRead: () => void = () => undefined
    let held = false
    server.assetBy('asset-2', () => {
      if (held) throw httpError(500)
      held = true

      return new Promise((resolve) => (answerRead = () => resolve(image(null))))
    })
    list.tiles()[1].click()
    await settled()
    editOfStrip.click()
    await eventually(() => expect(list.queue()).not.toBeNull())
    madePrivate()
    await settled()
    const saveAndFinish = await eventually(() => {
      const button = buttonsNamed(list.queue()!, 'Save and finish')[0]
      expect(button?.disabled).toBe(false)

      return button
    })
    saveAndFinish.click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    answerRead()
    await settled()

    expect(list.alerts()).toEqual([UPDATED, SYSTEM_ERROR])
  })
})
