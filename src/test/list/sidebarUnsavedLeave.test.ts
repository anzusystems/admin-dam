import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The panel beside the list of assets holds what was typed into it and not saved, and so does the detail opened over
 * the list. A click on another tile and an arrow key ask before they replace it (`sidebarUnsaved.test.ts`); here are
 * the other ways it goes: the edit of a row of a queue and an asset just created, which write another asset in its
 * place, and the ways out of the page - a link, the back button of the browser, a change of the licence, a reload or
 * a closed window. A way out is asked about once nothing can call it off any more: over an open dialog or menu the
 * back button is called off by Vuetify, and is no way out. The real page of the list with its real panel,
 * detail, queues and menu, as the router draws it,
 * and the page of the list of an external provider beside it; the server is a fake, and so are the address the page
 * asks about a new version of the application and the reload of the window. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/
const OTHER_LICENCE = /^\/adm\/v1\/asset-licence\/2$/
const CURRENT_USER = /^\/adm\/users\/current$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const DOWNLOAD_LINK = /^\/adm\/v1\/video\/file-1\/download-link$/
/** The address the server signs for the download of a file: answered as an attachment, on another origin. */
const SIGNED = 'https://storage.test/file-1?signature=1'

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const EDIT = 'Edit more'
const UPDATED = 'Record was updated'
const CREATED = 'Record was created'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const CHANGE_LICENCE = 'Switch Media Library ext system and asset licence'

const LIST = '/assets'
const SETTINGS = '/settings'
const PROVIDED = '/external-providers/' + PROVIDER
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'

/** An asset the server has, in the list and in its detail: a video unless told otherwise, its title is its id. */
const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** How many times the server was asked for each of the three assets of the list, and for the one of the queue row. */
const reads = () => ['asset-1', 'asset-2', 'asset-3', UPLOADED].map((assetId) => server.assetReads(assetId))

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** The asset the open detail holds, as the file panel of its form says it. */
const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The questions about changes that were not saved that are open: one at most, whoever draws it. */
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

/** The button of the open question. */
const answer = async (name: typeof STAY | typeof LEAVE) => {
  buttonsNamed(questions()[0], name)[0].click()
  await settled()
}

/** The open dialog that shows the text, or null. */
const dialogOf = (text: string) =>
  Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find((dialog) =>
    dialog.textContent?.includes(text)
  ) ?? null

/** What the browser is told when the window is about to go - a reload, a closed tab: true when it is to ask first. */
const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

/** The page of the list with its three assets, none of them picked, and one uploaded asset in the upload queue. */
const openList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: uploaded },
  })
  // The provider, as the config of the ext system names it, and the licences a user picks from.
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  config.damPrvConfig = {
    ...config.damPrvConfig,
    settings: { ...config.damPrvConfig.settings, allowSelectExtSystem: true, allowSelectLicenceId: true },
  }
  // The user as the bar of the page draws them, with two licences of the one ext system and the provider.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    userToExtSystemsDto: [{ id: 1, name: 'Ext system' }],
    assetLicencesDto: [
      { id: 1, name: 'Licence', extSystem: 1 },
      { id: 2, name: 'Other licence', extSystem: 1 },
    ],
    allowedAssetExternalProviders: [PROVIDER],
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  /* The page as the router draws it, at its own address: it asks the router about the way out of it. With it the
   * pages the bar of the list links to, and the page of the list of the provider. */
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: SETTINGS, component: { render: () => null } })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  /** The tiles as they are drawn now. */
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))
  /** The queue drawn over the whole page, or null while none is. */
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
  /** The menu of the page, opened: the item of it that is marked so. */
  const menuItem = async (mark: string) => {
    if (!document.body.querySelector('[data-cy="' + mark + '"]')) {
      page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    }

    return eventually(() => {
      const item = document.body.querySelector<HTMLElement>('[data-cy="' + mark + '"]')
      expect(item).not.toBeNull()

      return item!
    })
  }

  return {
    ...ui,
    page,
    tiles,
    queue,
    /** Where the router is: the address of the page it draws. */
    at: () => ui.router.currentRoute.value.path,
    /** Which of the tiles is the active one. */
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    /** A click on the tile, and the read it starts answered. */
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    /** The title in the form of the panel. */
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')!,
    save: () => buttonsNamed(panel(), 'Save')[0],
    /** The upload queue drawn over the whole page, as its "Add description" button draws it. */
    openUploadQueue: () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()

      return eventually(() => expect(queue()).not.toBeNull())
    },
    /** The mass edit of the tile drawn over the whole page: the tile is picked for it, and its queue opened. */
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
    /** The edit of the first row of the queue drawn over the whole page, once the row can be edited: pressed. */
    editRow: async () => {
      const edit = await eventually(() => {
        const button = queue() ? buttonsNamed(queue()!, EDIT)[0] : undefined
        expect(button?.disabled).toBe(false)

        return button!
      })
      edit.click()
      await settled()
    },
    /** "Create empty asset" of the menu of the page: the dialog that asks which kind is open. */
    openCreate: async () => {
      ;(await menuItem('button-main-empty-asset')).click()

      return eventually(() => {
        const dialog = document.body.querySelector<HTMLElement>('[data-cy="create-panel"]')
        expect(dialog).not.toBeNull()

        return dialog!
      })
    },
    /** The dialog that changes the licence, from the menu of the page, with the other licence picked in it. */
    openLicenceChange: async () => {
      ;(await menuItem('button-switch-licence')).click()
      const dialog = await eventually(() => {
        const open = dialogOf(CHANGE_LICENCE)
        expect(open).not.toBeNull()

        return open!
      })
      const licence = Array.from(dialog.querySelectorAll<HTMLElement>('.v-select'))[1]
      licence.querySelector('.v-field')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      const other = await eventually(() => {
        const option = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
          (item) => item.textContent?.trim() === 'Other licence'
        )
        expect(option).toBeTruthy()

        return option!
      })
      other.click()
      await settled()

      return dialog
    },
    /** A link of the menu of the page, followed. */
    followMenuLink: async (mark: string) => {
      ;(await menuItem(mark)).click()
      await settled()
    },
    /** The user goes where the address says, as a link of the application takes them. */
    goTo: async (address: string) => {
      // Not awaited before the clock moves: an open dialog or menu of Vuetify holds every navigation back by a timer.
      void ui.router.push(address)
      await settled()
    },
    /** The way back in the history, with nothing but the router told of it. */
    goBack: async () => {
      ui.router.back()
      await settled()
    },
    /**
     * The back button of the browser as the application hears it: the router first, then whatever else listens to
     * `popstate` on the window - every dialog and menu of Vuetify keeps a watch of its own there. The state is the one
     * of the entry of the history the browser goes back to.
     */
    goBackInTheBrowser: async (state: Record<string, unknown> = {}) => {
      ui.router.back()
      // The guards of the router run up to the one of Vuetify that waits a moment for the event below.
      for (let turn = 0; turn < 50; turn++) await Promise.resolve()
      window.dispatchEvent(new PopStateEvent('popstate', { state }))
      await settled()
    },
  }
}

type List = Awaited<ReturnType<typeof openList>>

const typeInto = async (field: HTMLTextAreaElement, value = TYPED) => {
  field.value = value
  field.dispatchEvent(new Event('input'))
  await nextTick()
}

/** The second of the three assets picked, and its title typed into the panel: the element typed into. */
const typedIntoTheSecond = async (list: List) => {
  await list.pick(1)
  await typeInto(list.title())

  return list.title()
}

/** What was typed is where it was typed, in the very field, and its "Save" still to be pressed. */
const typedIsKept = (list: List, typedInto: HTMLTextAreaElement) =>
  expect([list.title() === typedInto, typedInto.isConnected, typedInto.value, standsOut(list.save())]).toEqual([
    true,
    true,
    TYPED,
    true,
  ])

const closeDetail = async () => {
  detail()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
  await eventually(() => expect(detail()).toBeNull())
}

let reload: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  server = createFakeDam()
  for (const id of ['asset-1', 'asset-2', 'asset-3']) server.asset(onServer(id))
  server.asset(
    onServer(UPLOADED, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
    })
  )
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', OTHER_LICENCE, () => ({ status: 200, data: { id: 2, name: 'Other licence', extSystem: 1 } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', CURRENT_USER, () => ({ status: 200, data: { id: 7 } }))
  // An asset with no file yet, as the server makes one.
  server.on('POST', CREATE, () => ({
    status: 201,
    data: onServer('asset-new', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null }),
  }))
  // The window is one for the whole file, and so is its address. It is not to be reloaded under the cases.
  window.history.replaceState(null, '', LIST)
  reload = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined)
  server.on('GET', DOWNLOAD_LINK, () => ({ status: 200, data: { link: SIGNED } }))
})

afterEach(() => {
  reload.mockRestore()
  stopUploadUi()
})

/* The edit of a row of a queue reads the asset of the row into the detail, which is where the panel reads from: it
 * always reads, also the asset the panel holds. */
describe('metadata typed into the panel beside the list and not saved, when a row of a queue is edited', () => {
  it.each<[string, (list: List) => Promise<void>, string, number]>([
    ['the upload queue', (list) => list.openUploadQueue(), UPLOADED, 3],
    ['the mass edit', (list) => list.openMassEdit(2), 'asset-3', 2],
  ])(
    'are asked about by the edit of a row of %s: "Stay" keeps them, "Leave anyway" opens it',
    async (_of, open, id, read) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)
      await open(list)
      const before = { asked: server.requests.length, reads: reads() }

      await list.editRow()

      // Nothing was read and nothing is open: the panel is not even behind its loader.
      expect([questions().length, detail(), server.requests.length - before.asked]).toEqual([1, null, 0])
      typedIsKept(list, typedInto)

      await answer(STAY)

      expect([questions(), detail(), list.queue() === null, server.requests.length - before.asked]).toEqual([
        [],
        null,
        false,
        0,
      ])
      typedIsKept(list, typedInto)

      // They are still not saved: the next try asks again.
      await list.editRow()
      expect([questions().length, server.requests.length - before.asked]).toEqual([1, 0])
      await answer(LEAVE)

      await eventually(() => expect(held()).toBe(id))
      expect([questions(), reads()[read] - before.reads[read], server.sent('PATCH', BULK)]).toEqual([[], 1, []])
    }
  )

  it('are asked about also when the row is of the asset the panel holds: its edit reads that asset anew', async () => {
    const list = await openList()
    await list.openUploadQueue()
    await list.editRow()
    await eventually(() => expect(held()).toBe(UPLOADED))
    await closeDetail()
    await typeInto(list.title())
    const typedInto = list.title()
    expect(reads()).toEqual([0, 0, 0, 1])

    await list.editRow()

    expect([questions().length, detail(), reads()]).toEqual([1, null, [0, 0, 0, 1]])
    await answer(STAY)
    typedIsKept(list, typedInto)

    await list.editRow()
    await answer(LEAVE)
    await eventually(() => expect(held()).toBe(UPLOADED))
    expect([reads(), detail()!.querySelector<HTMLTextAreaElement>('textarea')!.value]).toEqual([
      [0, 0, 0, 2],
      FROM_SERVER,
    ])
  })

  // The answer can take its time, and the queue goes on under the question meanwhile.
  it('are kept when the row is of another asset by the time "Leave anyway" is said: nothing is read', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    await list.openUploadQueue()
    await list.editRow()
    expect(questions()).toHaveLength(1)

    list.rows.global[0].assetId = 'asset-3'
    await answer(LEAVE)

    expect([questions(), detail(), reads()]).toEqual([[], null, [0, 1, 0, 0]])
    typedIsKept(list, typedInto)
  })

  it('are not there to be asked about when nothing was typed: the detail of the row opens at once', async () => {
    const list = await openList()
    await list.pick(1)
    await list.openUploadQueue()

    await list.editRow()

    await eventually(() => expect(held()).toBe(UPLOADED))
    expect([questions(), reads()]).toEqual([[], [0, 1, 0, 1]])
  })
})

/* The asset the server makes is written into the detail, which is where the panel reads from, and its detail opens. */
describe('metadata typed into the panel beside the list and not saved, when an empty asset is created', () => {
  const confirm = async (dialog: HTMLElement) => {
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
    await settled()
  }

  it('are asked about as the dialog is confirmed: "Stay" sends nothing, "Leave anyway" creates the asset', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    // The dialog that asks for the kind of the asset asks nothing yet: it can be looked at and closed.
    const dialog = await list.openCreate()
    expect(questions()).toEqual([])

    await confirm(dialog)

    expect([questions().length, server.sent('POST', CREATE), dialog.isConnected]).toEqual([1, [], true])
    typedIsKept(list, typedInto)

    await answer(STAY)

    // The dialog is the one that was open, as it was.
    expect([questions(), server.sent('POST', CREATE), dialog.isConnected, detail()]).toEqual([[], [], true, null])
    expect(dialog.querySelector('button[data-cy="button-confirm"]')).not.toBeNull()
    typedIsKept(list, typedInto)

    await confirm(dialog)
    expect(questions()).toHaveLength(1)
    await answer(LEAVE)

    await eventually(() => expect(held()).toBe('asset-new'))
    expect([questions(), server.sent('POST', CREATE).length, list.alerts()]).toEqual([[], 1, [CREATED]])
  })

  it('are not there to be asked about when nothing was typed: the asset is created at once', async () => {
    const list = await openList()
    await list.pick(1)

    await confirm(await list.openCreate())

    await eventually(() => expect(held()).toBe('asset-new'))
    expect([questions(), server.sent('POST', CREATE).length]).toEqual([[], 1])
  })
})

describe('metadata typed into the panel beside the list and not saved, when the page of the list is left', () => {
  /** A way out of the page, the address it leads to, and what brings the user back to where the way starts from. */
  const waysOut: Array<[string, (list: List) => Promise<void>, string]> = [
    ['a link of the menu of the page', (list) => list.followMenuLink('button-settings'), SETTINGS],
    ['a link of the application', (list) => list.goTo(PROVIDED), PROVIDED],
    ['the way back in the history', (list) => list.goBack(), '/'],
    ['the back button of the browser, with nothing open over the page', (list) => list.goBackInTheBrowser(), '/'],
  ]

  it.each(waysOut)(
    'are asked about by %s: "Stay" keeps the page, "Leave anyway" leaves it',
    async (_way, go, address) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)
      const asked = server.requests.length

      await go(list)

      expect(questions()).toHaveLength(1)
      expect(questions()[0].textContent).toContain('You have unsaved changes. Are you sure you want to leave?')
      expect([list.at(), list.tiles().length, server.requests.length - asked]).toEqual([LIST, 3, 0])

      await answer(STAY)

      expect([questions(), list.at(), list.active(), server.requests.length - asked]).toEqual([
        [],
        LIST,
        [false, true, false],
        0,
      ])
      typedIsKept(list, typedInto)

      // They are still not saved, and the page is where it was: the same way asks again.
      await go(list)
      expect([questions().length, list.at()]).toEqual([1, LIST])
      await answer(LEAVE)

      expect([questions(), list.at(), list.tiles(), server.sent('PATCH', BULK)]).toEqual([[], address, [], []])
    }
  )

  it('are not there to be asked about when nothing was typed, nor once the panel has saved them', async () => {
    const list = await openList()
    await list.pick(1)

    await list.goTo(SETTINGS)
    expect([questions(), list.at()]).toEqual([[], SETTINGS])

    await list.goBack()
    await eventually(() => expect(list.tiles()).toHaveLength(3))
    await typedIntoTheSecond(list)
    list.save().click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    await list.goTo(SETTINGS)
    expect([questions(), list.at()]).toEqual([[], SETTINGS])
  })

  /* Over an open dialog or menu the back button of the browser is no way out of the page: Vuetify calls the
   * navigation off, by a guard of its own for each of them. A dialog of this application stays as it is - the
   * library makes every dialog persistent - and a menu closes. The page asks after those guards, so nothing is left
   * to ask about. */
  it.each<[string, boolean]>([
    ['with metadata typed into it', true],
    ['with nothing typed', false],
  ])(
    'are not asked about by the back button of the browser over an open detail, %s: nothing moves',
    async (_how, typed) => {
      const list = await openList()
      list.pencil(1).click()
      await eventually(() => expect(held()).toBe('asset-2'))
      const title = detail()!.querySelector<HTMLTextAreaElement>('textarea')!
      if (typed) await typeInto(title)
      const asked = server.requests.length

      await list.goBackInTheBrowser()
      await settled()

      expect([questions(), list.at(), held(), server.requests.length - asked]).toEqual([[], LIST, 'asset-2', 0])
      expect([title.isConnected, title.value]).toEqual([true, typed ? TYPED : FROM_SERVER])
      // The way back is not taken later either: the router is where it was, and the next try is a try of its own.
      await list.goBackInTheBrowser()
      expect([questions(), list.at(), held()]).toEqual([[], LIST, 'asset-2'])
    }
  )

  it('are not asked about by the back button of the browser over an open menu of the page, which closes it', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
    list.page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    await eventually(() => expect(menu()).not.toBeNull())

    await list.goBackInTheBrowser()

    await eventually(() => expect(menu()).toBeNull())
    expect([questions(), list.at(), list.tiles().length]).toEqual([[], LIST, 3])
    typedIsKept(list, typedInto)
    // With nothing open over the page any more, the same button is a way out, and is asked about.
    await list.goBackInTheBrowser()
    expect([questions().length, list.at()]).toEqual([1, LIST])
  })

  /* Vuetify leaves the way back alone when the entry of the history it leads to was written by `replace`, as the
   * first page of a session is: the page would be left with its detail open. The question is the one of the detail,
   * a dialog over it. */
  it('are asked about by the back button over an open detail where that would leave the page', async () => {
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(held()).toBe('asset-2'))
    const typedInto = detail()!.querySelector<HTMLTextAreaElement>('textarea')!
    await typeInto(typedInto)

    await list.goBackInTheBrowser({ replaced: true })

    expect([questions().length, list.at(), held()]).toEqual([1, LIST, 'asset-2'])
    expect(document.body.querySelectorAll('.v-dialog.v-overlay--active')).toHaveLength(2)
    await answer(STAY)
    expect([questions(), list.at(), held(), typedInto.isConnected, typedInto.value]).toEqual([
      [],
      LIST,
      'asset-2',
      true,
      TYPED,
    ])

    await list.goBackInTheBrowser({ replaced: true })
    await answer(LEAVE)
    expect([questions(), list.at(), list.tiles()]).toEqual([[], '/', []])
  })

  // Another query or another hash of the list is the page of the list still.
  it.each([LIST + '?page=2', LIST + '#top'])(
    'are not asked about by a navigation that keeps the page: %s',
    async (to) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)

      await list.goTo(to)

      expect([questions(), list.router.currentRoute.value.fullPath, list.tiles().length]).toEqual([[], to, 3])
      typedIsKept(list, typedInto)
    }
  )

  // The question is the page's: the pages that come after it ask nothing, whatever the detail is left holding.
  it('are not asked about on the pages that come after the list', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.goTo(SETTINGS)
    await answer(LEAVE)
    expect(list.at()).toBe(SETTINGS)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    useAssetDetailStore().metadataAreTouched = true

    await list.goTo('/')

    expect([list.at(), useAssetDetailStore().leaveUnsavedQuestion]).toEqual(['/', false])
  })

  /* The detail has the address of its asset, and closing it gives the address of the list back: both are written
   * over the address of the page, with no navigation of the router. Nothing is left by them. */
  it('are not asked about by the address of a detail opened over them, nor by the one it gives back', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)

    buttonsNamed(panel(), EDIT)[0].click()
    await eventually(() => expect(held()).toBe('asset-2'))

    expect([questions(), window.location.pathname, list.at()]).toEqual([[], '/assets/asset-2', LIST])
    expect(detail()!.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe(TYPED)

    await closeDetail()

    expect([questions(), window.location.pathname, list.at()]).toEqual([[], LIST, LIST])
    typedIsKept(list, typedInto)
  })

  // One question at a time: the way out is told to stay, and the answer is for the way that asked first.
  it('are asked about once: a way out of the page under an open question stays', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.pick(2)
    expect(questions()).toHaveLength(1)

    await list.goTo(SETTINGS)

    expect([questions().length, list.at(), reads()]).toEqual([1, LIST, [0, 1, 0, 0]])
    await answer(LEAVE)
    expect([questions(), list.at(), list.active(), reads()]).toEqual([[], LIST, [false, false, true], [0, 1, 1, 0]])
  })
})

/* A reload and a closed window are no navigation the page could hold: the browser can be told to ask its own
 * question, and is told while there is something to lose. */
describe('metadata typed and not saved, when the window is reloaded or closed', () => {
  it('make the browser ask first, from the panel beside the list and from the detail alike', async () => {
    const list = await openList()
    expect(windowAsksBeforeItGoes()).toBe(false)
    await list.pick(1)
    expect(windowAsksBeforeItGoes()).toBe(false)

    await typeInto(list.title())
    expect(windowAsksBeforeItGoes()).toBe(true)

    // In the detail opened over them, and in the detail of an asset typed into there.
    buttonsNamed(panel(), EDIT)[0].click()
    await eventually(() => expect(held()).toBe('asset-2'))
    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  it('do not make it ask once they are saved', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    expect(windowAsksBeforeItGoes()).toBe(false)
  })

  /* The file of an asset is downloaded by a link of the detail, followed in the tab of the page. The server answers
   * it as an attachment and the page stays where it is, but the browser announces it as it announces any
   * navigation - in the task of the click or in one soon after it. Asked about, "Cancel" would stop the download. */
  describe('and a file is downloaded from the detail', () => {
    /* The window of the test follows a link of its own tab by taking the address of the link, the file it would
     * download in a browser: put back after each case. */
    const home = window.location.href
    afterEach(() => {
      ;(window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(home)
    })

    /** The detail of the second asset with metadata typed into it, and the link of its file in the open dialog. */
    const withTheLinkOfTheFile = async () => {
      const list = await openList()
      list.pencil(1).click()
      await eventually(() => expect(held()).toBe('asset-2'))
      await typeInto(detail()!.querySelector<HTMLTextAreaElement>('textarea')!)
      detail()!.querySelector<HTMLButtonElement>('[data-cy="button-download"]')!.click()

      return eventually(() => {
        const link = document.body.querySelector<HTMLAnchorElement>('[data-cy="button-download-file"]')
        expect(link?.getAttribute('href')).toBe(SIGNED)

        return link!
      })
    }

    it('do not make it ask for the navigation of the download, and make it ask for the one after', async () => {
      const link = await withTheLinkOfTheFile()
      // With the dialog open and the link not pressed, a window that goes is asked about.
      expect(windowAsksBeforeItGoes()).toBe(true)

      link.click()
      await vi.advanceTimersByTimeAsync(300)

      expect(windowAsksBeforeItGoes()).toBe(false)
      // The link is followed as it always was: its own address, in this tab, with nothing set on it.
      expect([window.location.href, link.getAttribute('target'), link.hasAttribute('download')]).toEqual([
        SIGNED,
        null,
        false,
      ])
      // That one navigation only: a reload or a closed window right after it is asked about.
      expect(windowAsksBeforeItGoes()).toBe(true)
    })

    // A press the browser announced nothing for is not held against the window for long.
    it('make it ask again once the moment of a download has passed with no navigation', async () => {
      const link = await withTheLinkOfTheFile()

      link.click()
      await vi.advanceTimersByTimeAsync(1_500)

      expect(windowAsksBeforeItGoes()).toBe(true)
    })
  })

  // What the browser is told goes with the page: another page has nothing of the list to lose.
  it('do not make it ask once the page of the list is left, whatever its detail is left holding', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.goTo(SETTINGS)
    await answer(LEAVE)
    expect(list.at()).toBe(SETTINGS)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    expect(useAssetDetailStore().panelHoldsUnsavedMetadata).toBe(false)

    useAssetDetailStore().metadataAreTouched = true

    expect([useAssetDetailStore().panelHoldsUnsavedMetadata, windowAsksBeforeItGoes()]).toEqual([true, false])
  })
})

/* The licence is changed in a dialog of the menu of the page, and the page is reloaded once the server took the
 * change: whatever the page holds goes with it. */
describe('metadata typed into the panel beside the list and not saved, when the licence is changed', () => {
  const confirm = async (dialog: HTMLElement) => {
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
    await settled()
  }
  /** What the server was asked on the way of the change: the licence, and the change of the user. */
  const sent = () => [server.sent('GET', OTHER_LICENCE).length, server.sent('PATCH', CURRENT_USER).length]

  it('are asked about as the change is confirmed: "Stay" sends nothing, "Leave anyway" changes it and reloads', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const dialog = await list.openLicenceChange()
    expect(questions()).toEqual([])
    /* What the browser is told as the page is reloaded. */
    const askedOnReload: boolean[] = []
    reload.mockImplementation(() => void askedOnReload.push(windowAsksBeforeItGoes()))

    await confirm(dialog)

    expect([questions().length, sent(), reload.mock.calls, dialog.isConnected]).toEqual([1, [0, 0], [], true])
    typedIsKept(list, typedInto)

    await answer(STAY)

    // The dialog is the one that was open, with the licence that was picked in it.
    expect([questions(), sent(), reload.mock.calls, dialogOf(CHANGE_LICENCE) === dialog]).toEqual([
      [],
      [0, 0],
      [],
      true,
    ])
    expect(dialog.textContent).toContain('Other licence')
    typedIsKept(list, typedInto)

    await confirm(dialog)
    expect(questions()).toHaveLength(1)
    await answer(LEAVE)

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect([questions(), sent(), list.alerts()]).toEqual([[], [1, 1], [UPDATED]])
    expect(JSON.parse(server.sent('PATCH', CURRENT_USER)[0].data as string)).toEqual({ selectedLicence: 2 })
    // The answer was given to the question of the page: the browser does not ask it again over the reload.
    expect(askedOnReload).toEqual([false])
  })

  it('are kept when the server refuses the change after "Leave anyway": nothing is reloaded', async () => {
    server.on('PATCH', CURRENT_USER, () => {
      throw httpError(500)
    })
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const dialog = await list.openLicenceChange()

    await confirm(dialog)
    await answer(LEAVE)

    await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))
    expect([sent(), reload.mock.calls, dialogOf(CHANGE_LICENCE) === dialog]).toEqual([[1, 1], [], true])
    typedIsKept(list, typedInto)
    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  it('are not there to be asked about when nothing was typed: the licence is changed at once', async () => {
    const list = await openList()
    await list.pick(1)

    await confirm(await list.openLicenceChange())

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect([questions(), sent()]).toEqual([[], [1, 1]])
  })
})

/* The upload queue, the create button and the dialog of the licence are drawn on every page with the bar of the
 * application, the page of the list of an external provider among them - and the question about what was not saved
 * only on the page of the list of DAM. The detail they write into is emptied as that page is left: on another page
 * there is nothing of it to ask about, and nothing to draw the question that would be waited for. */
describe('the page of the list of an external provider, come to from metadata typed and not saved', () => {
  /** The page of the provider, left for with "Leave anyway". */
  const onTheProviderPage = async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.goTo(PROVIDED)
    await answer(LEAVE)
    expect([list.at(), questions()]).toEqual([PROVIDED, []])
    await eventually(() => expect(list.page.textContent).toContain('No matching assets found'))

    return list
  }

  it('creates an empty asset at once: nothing is asked, and nothing waits for an answer', async () => {
    const list = await onTheProviderPage()

    const dialog = await list.openCreate()
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()

    await eventually(() => expect(server.sent('POST', CREATE)).toHaveLength(1))
    expect(questions()).toEqual([])
  })

  it('reads the asset of a row of the upload queue at once', async () => {
    const list = await onTheProviderPage()
    await list.openUploadQueue()

    await list.editRow()

    expect([questions(), reads()]).toEqual([[], [0, 1, 0, 1]])
  })

  it('changes the licence at once', async () => {
    const list = await onTheProviderPage()
    const dialog = await list.openLicenceChange()

    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect([questions(), server.sent('PATCH', CURRENT_USER).length]).toEqual([[], 1])
  })
})
