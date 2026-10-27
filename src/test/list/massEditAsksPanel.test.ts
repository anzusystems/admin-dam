import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* "Uložiť" and "Uložiť a ukončiť" of the mass edit save the asset the panel beside the list holds, and the read after the
 * save puts the asset as saved into the panel: what was typed there and not saved went without a word. It is asked
 * about first, as every other way that throws it away: "Zostať" sends nothing, "Odísť aj tak" saves and reads. The
 * real page of the list with its real panel and mass edit, as the router draws it; the server is a fake, and so is the
 * address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/file-1\/make-private$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const UPDATED = 'Record was updated'
const TYPED = 'typed and not saved'
const EDIT_MORE = 'Edit more'

const LIST = '/assets'
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'

/** An asset the server has, in the list and in its detail: a video unless told otherwise, its title is its id. */
const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

/** What the server lists, in this order: the three videos unless a case lists others. */
let listed: ReturnType<typeof onServer>[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
/** The questions about changes that were not saved that are open: one at most, whoever draws it. */
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )
const answer = async (name: typeof STAY | typeof LEAVE) => {
  buttonsNamed(questions()[0], name)[0].click()
  await settled()
}

/** The page of the list with what the server lists, none of it picked, and one uploaded asset in the upload queue. */
const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: [queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' })] },
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
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  /** The tiles as they are drawn now: a list read anew draws new ones. */
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(listed.length))
  /** The queue drawn over the whole page, or null while none is. */
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

  return {
    ...ui,
    page,
    tiles,
    queue,
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
    /** The list read anew, by its button. */
    reload: async () => {
      buttonsNamed(page, 'Reload list')[0].click()
      await settled()
    },
    /** "Make private" of the menu of the file card of the panel, pressed. */
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
    /** The upload queue drawn over the whole page, and the edit of its row pressed once the row can be edited. */
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
    /** The tile picked for the mass edit, and its queue drawn over the whole page. */
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
    /** What the bar of the open detail says: the place of the asset in the list and its title; null with none open. */
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

/** The second asset picked, and its title typed into the panel: the element typed into. */
const typedIntoTheSecond = async (list: List) => {
  await list.pick(1)
  await typeInto(list.title())

  return list.title()
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

const SAVE = 'Save and continue'
const SAVE_AND_FINISH = 'Save and finish'
const SAVED = { title: 'saved', note: 'kept' }

/** How many times the server was asked for the asset the panel holds. */
const readsOfPanel = () => server.assetReads('asset-2')

/** The button of the mass edit drawn over the whole page, once it can be pressed. */
const massButton = (list: List, name: string) =>
  eventually(() => {
    const found = buttonsNamed(list.queue()!, name)[0]
    expect(found?.disabled).toBe(false)

    return found!
  })

/** The asset of the panel picked for the mass edit too, with its title typed into the panel. */
const typedAndPicked = async () => {
  const list = await openList()
  await typedIntoTheSecond(list)
  await list.openMassEdit(1)
  const before = readsOfPanel()

  return { list, before }
}

describe('a save of the mass edit that saves the asset of the panel with metadata typed there', () => {
  it.each([SAVE, SAVE_AND_FINISH])('"%s" asks first, and sends nothing until answered', async (name) => {
    const { list } = await typedAndPicked()

    ;(await massButton(list, name)).click()
    await settled()

    expect([questions().length, server.sent('PATCH', BULK).length]).toEqual([1, 0])
  })

  it.each([SAVE, SAVE_AND_FINISH])(
    '"%s" sends nothing after "Stay", and the panel keeps what was typed',
    async (name) => {
      const { list, before } = await typedAndPicked()
      ;(await massButton(list, name)).click()
      await settled()

      await answer(STAY)

      expect([questions(), server.sent('PATCH', BULK).length, readsOfPanel() - before]).toEqual([[], 0, 0])
      expect([list.queue() !== null, list.alerts(), list.title().value, standsOut(list.save())]).toEqual([
        true,
        [],
        TYPED,
        true,
      ])
    }
  )

  it('saves after "Leave anyway", and reads the asset into the panel', async () => {
    const { list, before } = await typedAndPicked()
    server.on('PATCH', BULK, (request) => {
      listed[1] = onServer('asset-2', {
        metadata: { customData: SAVED, authorSuggestions: {}, keywordSuggestions: {} },
      })
      server.asset(listed[1])

      return { status: 200, data: JSON.parse(request.data as string) }
    })
    ;(await massButton(list, SAVE)).click()
    await settled()

    await answer(LEAVE)

    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    expect(server.sent('PATCH', BULK)).toHaveLength(1)
    await eventually(() => expect(readsOfPanel() - before).toBe(1))
    await eventually(() => expect(list.title().value).toBe(SAVED.title))
    expect([questions(), standsOut(list.save())]).toEqual([[], false])
  })

  // Not saved, nothing is read: what was typed stays, unsaved, and the next way elsewhere asks about it again.
  it('keeps what was typed when the save fails after "Leave anyway", and asks about it again', async () => {
    const { list, before } = await typedAndPicked()
    server.on('PATCH', BULK, () => {
      throw httpError(500)
    })
    ;(await massButton(list, SAVE)).click()
    await settled()

    await answer(LEAVE)

    await eventually(() => expect(list.alerts()).toHaveLength(1))
    expect([readsOfPanel() - before, list.title().value, standsOut(list.save())]).toEqual([0, TYPED, true])
    ;(await massButton(list, SAVE)).click()
    await settled()
    expect(questions()).toHaveLength(1)
  })

  /* After "Leave anyway" the mass edit can be put away while its save is on its way: what was typed into the panel then
   * would be replaced by the read after the save without a question. The panel takes no typing until that read has
   * landed - it shows its spinner, as while it reads - and gives the form back as it was when the save fails. */
  it.each<[string, boolean, string]>([
    ['answered', true, SAVED.title],
    ['refused', false, TYPED],
  ])(
    'takes no typing into the panel while the save is on its way after "Leave anyway": %s',
    async (_how, saved, title) => {
      const { list } = await typedAndPicked()
      let answerSave: () => void = () => undefined
      server.on(
        'PATCH',
        BULK,
        (request) =>
          new Promise<FakeDamAnswer>((resolve, reject) => {
            answerSave = () => {
              if (!saved) return reject(httpError(500))
              listed[1] = onServer('asset-2', {
                metadata: { customData: SAVED, authorSuggestions: {}, keywordSuggestions: {} },
              })
              server.asset(listed[1])
              resolve({ status: 200, data: JSON.parse(request.data as string) })
            }
          })
      )
      ;(await massButton(list, SAVE)).click()
      await settled()
      await answer(LEAVE)
      expect(server.sent('PATCH', BULK)).toHaveLength(1)

      // Put away by its own button while its save is on its way.
      buttonsNamed(list.queue()!, 'Hide')[0].click()
      await eventually(() => expect(list.queue()).toBeNull())
      expect([panel().querySelector('textarea'), panel().querySelector('.v-progress-circular') !== null]).toEqual([
        null,
        true,
      ])

      answerSave()
      await eventually(() => expect(panel().querySelector('textarea')?.value).toBe(title))
      expect(standsOut(list.save())).toBe(!saved)
    }
  )

  // The guard: with nothing typed, nothing is asked, as before.
  it('asks nothing when nothing is typed into the panel, saves and reads', async () => {
    const list = await openList()
    await list.pick(1)
    await list.openMassEdit(1)
    const before = readsOfPanel()

    ;(await massButton(list, SAVE)).click()

    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    expect([questions(), server.sent('PATCH', BULK).length]).toEqual([[], 1])
    await eventually(() => expect(readsOfPanel() - before).toBe(1))
  })
})

/* The upload queue saves its rows in bulk as well, and the asset of one of them can be in the panel: "Edit more" of the
 * row opens its detail, and the panel keeps the asset once the detail is closed. Its save neither asked about what was
 * typed into the panel nor read the asset into it: the panel showed it as before the save, and a save of the panel
 * then sent that over what the queue had saved. */
describe('a save of the upload queue that saves the asset of the panel', () => {
  const readsOfUploaded = () => server.assetReads(UPLOADED)

  /** The uploaded asset in the panel, by the edit of its row with the detail closed again; the queue hidden. */
  const uploadedInPanel = async () => {
    const list = await openList()
    await list.editRowOfUploadQueue()
    await eventually(() => expect(dialogOfList()).not.toBeNull())
    dialogOfList()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
    await eventually(() => expect(dialogOfList()).toBeNull())
    buttonsNamed(list.queue()!, 'Hide')[0].click()
    await eventually(() => expect(list.queue()).toBeNull())

    return list
  }

  /** The upload queue drawn over the whole page again, as its "Add description" button draws it. */
  const openUploadQueue = async (list: List) => {
    document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
    await eventually(() => expect(list.queue()).not.toBeNull())
  }

  /** The uploaded asset in the panel with its title typed there, and the upload queue drawn over the page again. */
  const typedAndQueued = async () => {
    const list = await uploadedInPanel()
    await typeInto(list.title())
    await openUploadQueue(list)

    return { list, before: readsOfUploaded() }
  }

  it.each([SAVE, SAVE_AND_FINISH])('"%s" asks first, and sends nothing until answered', async (name) => {
    const { list } = await typedAndQueued()

    ;(await massButton(list, name)).click()
    await settled()

    expect([questions().length, server.sent('PATCH', BULK).length]).toEqual([1, 0])
  })

  it.each([SAVE, SAVE_AND_FINISH])(
    '"%s" sends nothing after "Stay", and the panel keeps what was typed',
    async (name) => {
      const { list, before } = await typedAndQueued()
      ;(await massButton(list, name)).click()
      await settled()

      await answer(STAY)

      expect([questions(), server.sent('PATCH', BULK).length, readsOfUploaded() - before]).toEqual([[], 0, 0])
      expect([list.queue() !== null, list.alerts(), list.title().value]).toEqual([true, [], TYPED])
    }
  )

  it.each([SAVE, SAVE_AND_FINISH])(
    '"%s" saves after "Leave anyway", and reads the asset into the panel',
    async (name) => {
      const { list, before } = await typedAndQueued()
      server.on('PATCH', BULK, (request) => {
        server.asset(
          onServer(UPLOADED, {
            attributes: { assetType: 'image', assetStatus: 'with_file' },
            mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
            metadata: { customData: SAVED, authorSuggestions: {}, keywordSuggestions: {} },
          })
        )

        return { status: 200, data: JSON.parse(request.data as string) }
      })
      ;(await massButton(list, name)).click()
      await settled()

      await answer(LEAVE)

      await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
      expect(server.sent('PATCH', BULK)).toHaveLength(1)
      await eventually(() => expect(readsOfUploaded() - before).toBe(1))
      await eventually(() => expect(list.title().value).toBe(SAVED.title))
      expect([questions(), standsOut(list.save())]).toEqual([[], false])
    }
  )

  // With nothing typed into the panel nothing is asked, and the asset is read into it all the same.
  it('asks nothing when nothing is typed into the panel, saves and reads the asset into it', async () => {
    const list = await uploadedInPanel()
    await openUploadQueue(list)
    const before = readsOfUploaded()

    ;(await massButton(list, SAVE)).click()

    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    expect([questions(), server.sent('PATCH', BULK).length]).toEqual([[], 1])
    await eventually(() => expect(readsOfUploaded() - before).toBe(1))
  })
})
