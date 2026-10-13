import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  forbiddenOperationError,
  httpError,
  queueRow,
} from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/* The file of an asset is public or private. The menu of the file card makes it one or the other, in the detail of
 * the asset and in the panel beside the list alike, and once the change went through the asset is read again: the
 * card shows what the server holds. The real page of the list with its real detail, panel and upload queue, the
 * application around it as it starts; the server is a fake, and so is the address the page asks about a new version
 * of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const MAKE_PRIVATE = /^\/adm\/v1\/(image|audio|document)\/([^/]+)\/make-private$/
const MAKE_PUBLIC = /^\/adm\/v1\/(image|audio|document)\/([^/]+)\/make-public$/

const UNSAVED = 'Unsaved changes'
const LEAVE = 'Leave anyway'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const PUBLIC = 'File is public'
const PRIVATE = 'File is private'
const SINGLE_USE = 'Single-use license'
const STILL_PROCESSED = 'The file is still being processed.'

const RIGHT = 'ArrowRight'

const LIST = '/assets'
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'

/** The files the server holds as public, and what it holds changed in an asset besides its file. */
let published = new Set<string>()
let changedMeanwhile: Record<string, unknown> = {}

/** The kinds of asset whose file has a route: each is made public and private by requests of its own. */
type Kind = 'image' | 'document' | 'audio'
const kinds: Kind[] = ['image', 'document', 'audio']

/** What the second asset of the list is, and how far the server is with its file. */
let secondIs: Kind = 'image'
let secondFileIs: 'stored' | 'processed' = 'processed'

const routeOf = (fileId: string) => ({ id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId })

/** An asset as the server holds it now: the first of the list is a video, every other has a file with a route. */
const onServer = (id: string) => {
  if (id === 'asset-1') {
    return {
      ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
      keywords: [],
      authors: [],
    }
  }
  const fileId = id.replace('asset', 'file')
  const second = id === 'asset-2'

  return {
    ...assetDetail(id, {
      attributes: { assetType: second ? secondIs : 'image', assetStatus: 'with_file' },
      // Not described: while its file is not processed, the server may yet fill in its metadata.
      flags: { described: false, visible: true },
      mainFile: {
        ...assetFile(fileId, second ? secondFileIs : 'processed', { asset: id }),
        mainRoute: published.has(fileId) ? routeOf(fileId) : null,
      },
      ...changedMeanwhile,
    }),
    keywords: [],
    authors: [],
  }
}

/** The assets of the list, in its order. */
let listed: string[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

/** Past the few seconds in which an asset read a moment ago is not read again. */
const later = () => vi.advanceTimersByTimeAsync(6_000)

/** How many times the server was asked for each of the three assets of the list. */
const reads = () => ['asset-1', 'asset-2', 'asset-3'].map((assetId) => server.assetReads(assetId))

/** The read of the asset is held from now on: the answer is what the server holds when it is let go. */
const holdRead = (assetId: string) => {
  let letGo: () => void = () => undefined
  server.assetBy(assetId, () => new Promise((resolve) => (letGo = () => resolve(onServer(assetId)))))

  return () => {
    letGo()

    return settled()
  }
}

const address = () => window.location.pathname

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the bar of the open detail says: the place of the asset in the list and its title. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .join(' ')

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

/** The questions about changes that were not saved that are open. */
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

/** The page of the list with its three assets, none of them picked, and one uploaded asset in the upload queue. */
const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_document_update', 'dam_audio_update'],
    customForm: {
      video: [customField('title')],
      image: [customField('title')],
      document: [customField('title')],
      audio: [customField('title')],
    },
    queues: {
      global: [queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' })],
    },
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
  // The two pages the bar of the list links to.
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })

  const page = await ui.mount(() => import('@/domains/coreDam/asset/components/list/AssetListView.vue'))
  /** The tiles as they are drawn now: a list read anew draws new ones. */
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))

  return {
    ...ui,
    page,
    /** Which of the tiles is the active one. */
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    /** A click on the tile, and the read it starts answered. */
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    /** The list is read anew, with the assets in this order. */
    readAnew: async (order: string[]) => {
      listed = order
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await eventually(() =>
        expect(tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())).toEqual(order)
      )
    },
    /** The edit of the one row of the upload queue, from the queue drawn over the whole page. */
    editUploaded: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      const edit = await eventually(() => {
        const queue = document.body.querySelector('.overlay--sidebar')
        expect(queue).not.toBeNull()

        return buttonsNamed(queue!, 'Edit more')[0]
      })
      edit.click()
      await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent).toBe(UPLOADED))
    },
  }
}

type List = Awaited<ReturnType<typeof openList>>

/** Where the form of an asset is drawn, with the card of its file. */
interface Place {
  /** Opens it for the second asset of the list. */
  open: (list: List) => Promise<void>
  form: () => HTMLElement | null
  /** Goes on to the third asset of the list. */
  toTheThird: (list: List) => Promise<void>
}

const inDetail: Place = {
  open: async (list) => {
    list.pencil(1).click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
  },
  form: () => detail(),
  toTheThird: async () => {
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: RIGHT, bubbles: true }))
    await settled()
  },
}

const inPanel: Place = {
  open: (list) => list.pick(1),
  form: () => panel(),
  toTheThird: (list) => list.pick(2),
}

const places: Array<[string, Place]> = [
  ['the detail of the asset', inDetail],
  ['the panel beside the list', inPanel],
]

/** The title in the form: null while the form is behind its loader, or holds no asset. */
const title = (place: Place) => place.form()?.querySelector<HTMLTextAreaElement>('textarea') ?? null

const typeTitle = async (place: Place, value: string) => {
  const field = title(place)!
  field.value = value
  field.dispatchEvent(new Event('input'))
  await nextTick()

  return field
}

/** What the card of the file says of it: public or private. */
const route = (place: Place) =>
  Array.from(place.form()?.querySelectorAll('.v-chip') ?? [])
    .map((chip) => chip.textContent?.trim())
    .find((text) => text === PUBLIC || text === PRIVATE) ?? null

/** The asset and the file the form holds, as its file card says them. */
const held = (place: Place) =>
  Array.from(place.form()?.querySelectorAll('.anzu-copy-text > span') ?? []).map((id) => id.textContent?.trim())

const singleUse = (place: Place) =>
  Array.from(place.form()?.querySelectorAll('.v-switch') ?? [])
    .find((control) => control.querySelector('label')?.textContent?.trim() === SINGLE_USE)
    ?.querySelector<HTMLInputElement>('input')?.checked

/** The item of the menu of the file card, pressed. */
const fileMenu = async (place: Place, name: 'Make private' | 'Make public') => {
  if (!menu()) place.form()!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
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

/** The menu of the file card is gone once its action went through: left open, it holds the keys of the detail. */
const menuIsClosed = () => eventually(() => expect(menu()).toBeNull())

/** "Make public" asks in a dialog first: confirmed, and the dialog gone. */
const makePublic = async (place: Place) => {
  await fileMenu(place, 'Make public')
  const confirm = await eventually(() => {
    const button = dialogButton('Confirm')
    expect(button).not.toBeNull()

    return button!
  })
  confirm.click()
  await eventually(() => expect(dialogButton('Confirm')).toBeNull())
  await settled()
}

const leaveAnyway = async () => {
  buttonsNamed(questions()[0], LEAVE)[0].click()
  await settled()
}

beforeEach(() => {
  server = createFakeDam()
  published = new Set(['file-2', 'file-3', 'file-9'])
  changedMeanwhile = {}
  secondIs = 'image'
  secondFileIs = 'processed'
  listed = ['asset-1', 'asset-2', 'asset-3']
  for (const id of [...listed, UPLOADED]) server.assetBy(id, () => onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: listed.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  /* As core-dam answers them. A file made private: 204 with no body for an image and a document, 200 with the file
   * for an audio. A file made public: 200 with its route, for every kind. */
  server.on('PATCH', MAKE_PRIVATE, (_request, match) => {
    published.delete(match[2])

    return match[1] === 'audio' ? { status: 200, data: { id: match[2] } } : { status: 204 }
  })
  server.on('PATCH', MAKE_PUBLIC, (_request, match) => {
    published.add(match[2])

    return { status: 200, data: routeOf(match[2]) }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the asset read again once the address of its file has changed', () => {
  /** What else the server holds changed by then: seen only when the asset is taken whole. */
  const renamedMeanwhile = () => {
    changedMeanwhile = { texts: { displayTitle: 'renamed meanwhile' }, mainFileSingleUse: true }
  }

  it.each(places)('is taken whole by %s while nothing typed into it waits to be saved', async (_where, place) => {
    const list = await openList()
    await place.open(list)
    const answerRead = holdRead('asset-2')
    renamedMeanwhile()

    await fileMenu(place, 'Make private')

    // Behind its loader meanwhile.
    expect([server.sent('PATCH', MAKE_PRIVATE).length, reads(), title(place)]).toEqual([1, [0, 2, 0], null])

    await answerRead()

    expect([route(place), singleUse(place), title(place)?.value, reads()]).toEqual([
      PRIVATE,
      true,
      FROM_SERVER,
      [0, 2, 0],
    ])
    if (place === inDetail) expect([shown(), address()]).toEqual(['2 / 3 renamed meanwhile', '/assets/asset-2'])
  })

  it.each(places)(
    'gives %s its file alone while metadata typed into it are not saved: they stay where they were typed',
    async (_where, place) => {
      const list = await openList()
      await place.open(list)
      const typedInto = await typeTitle(place, TYPED)
      const answerRead = holdRead('asset-2')
      renamedMeanwhile()

      await fileMenu(place, 'Make private')

      // No loader goes over the form while the asset is read; the menu of the card is closed all the same.
      await menuIsClosed()
      expect([server.sent('PATCH', MAKE_PRIVATE).length, reads()]).toEqual([1, [0, 2, 0]])
      expect([title(place) === typedInto, typedInto.isConnected, typedInto.value, route(place)]).toEqual([
        true,
        true,
        TYPED,
        PUBLIC,
      ])

      await answerRead()

      expect([route(place), held(place), reads()]).toEqual([PRIVATE, ['asset-2', 'file-2'], [0, 2, 0]])
      // Nothing but the file: the field that was typed into, and the rest of the form as it was.
      expect([title(place) === typedInto, typedInto.isConnected, typedInto.value, singleUse(place)]).toEqual([
        true,
        true,
        TYPED,
        false,
      ])
      if (place === inDetail) expect([shown(), address()]).toEqual(['2 / 3 asset-2', '/assets/asset-2'])
      expect([questions(), list.alerts()]).toEqual([[], []])
      // Still to be saved, and saved as typed.
      const save = buttonsNamed(panel(), 'Save')[0]
      expect(standsOut(save)).toBe(true)
      save.click()
      await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
      expect(String(server.sent('PATCH', BULK)[0].data)).toContain(TYPED)
    }
  )

  it.each(places)('is not read into %s after a change the server refused', async (_where, place) => {
    server.on('PATCH', MAKE_PRIVATE, () => {
      throw httpError(500)
    })
    const list = await openList()
    await place.open(list)
    const untouched = title(place)

    await fileMenu(place, 'Make private')

    expect([server.sent('PATCH', MAKE_PRIVATE).length, reads(), list.alerts()]).toEqual([1, [0, 1, 0], [SYSTEM_ERROR]])
    expect([title(place) === untouched, untouched?.isConnected, route(place)]).toEqual([true, true, PUBLIC])
    // The menu is still there for another try.
    expect(menu()).not.toBeNull()

    // Nor with metadata typed into it meanwhile.
    await typeTitle(place, TYPED)
    await fileMenu(place, 'Make private')

    expect([server.sent('PATCH', MAKE_PRIVATE).length, reads()]).toEqual([2, [0, 1, 0]])
    expect(list.alerts()).toEqual([SYSTEM_ERROR, SYSTEM_ERROR])
    expect([title(place) === untouched, untouched?.value, route(place)]).toEqual([true, TYPED, PUBLIC])
    expect(list.active()).toEqual([false, true, false])
  })

  // "Make public" asks in a dialog first; the dialog closes whatever the server answers.
  it('is not read after a "Make public" the server refused, and is after one that went through', async () => {
    published.delete('file-2')
    let refuse = true
    server.on('PATCH', MAKE_PUBLIC, (_request, match) => {
      if (refuse) throw httpError(500)
      published.add(match[2])

      return { status: 200, data: routeOf(match[2]) }
    })
    const list = await openList()
    await inDetail.open(list)
    const typedInto = await typeTitle(inDetail, TYPED)

    await makePublic(inDetail)

    expect([server.sent('PATCH', MAKE_PUBLIC).length, reads(), route(inDetail)]).toEqual([1, [0, 1, 0], PRIVATE])
    expect(list.alerts()).toEqual([SYSTEM_ERROR])

    refuse = false
    await makePublic(inDetail)
    await menuIsClosed()

    expect([server.sent('PATCH', MAKE_PUBLIC).length, reads(), route(inDetail)]).toEqual([2, [0, 2, 0], PUBLIC])
    expect([title(inDetail) === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
    expect(list.alerts()).toEqual([SYSTEM_ERROR, UPDATED])
  })

  /* A change that did not go through says so, whatever it failed with: the requests of a route reject with what axios
   * threw, or with nothing when the answer is not one of the two they take for done. */
  it.each<[string, () => FakeDamAnswer]>([
    [
      'the server refused it',
      () => {
        throw httpError(500)
      },
    ],
    [
      'the server could not be reached',
      () => {
        throw new AxiosError('Network Error', 'ERR_NETWORK')
      },
    ],
    ['the answer is neither 200 nor 204', () => ({ status: 202, data: {} })],
  ])('says once that the change did not go through when %s', async (_why, answer) => {
    server.on('PATCH', MAKE_PRIVATE, answer)
    const list = await openList()
    await inDetail.open(list)

    await fileMenu(inDetail, 'Make private')

    expect([list.alerts(), route(inDetail), reads()]).toEqual([[SYSTEM_ERROR], PUBLIC, [0, 1, 0]])
  })

  /* The item stays in the open menu while its request is on its way, and its confirm button only spins: pressed
   * again, each sent the change once more. The server holds no route by then, or holds one already, and refuses
   * the second of them - an error said over a change that went through. */
  describe('while a change is on its way', () => {
    /** Every request of the kind is held; let go, each is answered in turn as core-dam answers it. */
    const holding = (pattern: RegExp, done: (fileId: string) => FakeDamAnswer | null) => {
      const waiting: Array<() => void> = []
      server.on(
        'PATCH',
        pattern,
        (_request, match) =>
          new Promise<FakeDamAnswer>((resolve, reject) => {
            waiting.push(() => {
              const answer = done(match[2])
              if (answer) resolve(answer)
              else reject(forbiddenOperationError('forbidden_operation'))
            })
          })
      )

      return async () => {
        waiting.splice(0).forEach((answer) => answer())
        await settled()
      }
    }

    it.each(places)('sends "Make private" once, however often its item is pressed in %s', async (_where, place) => {
      // Refused once the file has no route left.
      const answer = holding(MAKE_PRIVATE, (fileId) => (published.delete(fileId) ? { status: 204 } : null))
      const list = await openList()
      await place.open(list)

      await fileMenu(place, 'Make private')
      await fileMenu(place, 'Make private')
      await fileMenu(place, 'Make private')

      expect([server.sent('PATCH', MAKE_PRIVATE).length, reads(), route(place)]).toEqual([1, [0, 1, 0], PUBLIC])

      await answer()

      expect([server.sent('PATCH', MAKE_PRIVATE).length, reads(), route(place)]).toEqual([1, [0, 2, 0], PRIVATE])
      expect(list.alerts()).toEqual([])
    })

    // The button is not disabled while it spins: a key pressed on it, still in focus, is a click again.
    it('sends "Make public" once, however often its dialog is confirmed', async () => {
      published.delete('file-2')
      // Refused once the file has a route.
      const answer = holding(MAKE_PUBLIC, (fileId) => {
        if (published.has(fileId)) return null
        published.add(fileId)

        return { status: 200, data: routeOf(fileId) }
      })
      const list = await openList()
      await inDetail.open(list)
      await fileMenu(inDetail, 'Make public')
      const confirm = await eventually(() => {
        const button = dialogButton('Confirm')
        expect(button).not.toBeNull()

        return button!
      })

      confirm.click()
      confirm.click()
      await settled()

      expect([server.sent('PATCH', MAKE_PUBLIC).length, reads(), route(inDetail)]).toEqual([1, [0, 1, 0], PRIVATE])

      await answer()

      expect([server.sent('PATCH', MAKE_PUBLIC).length, reads(), route(inDetail)]).toEqual([1, [0, 2, 0], PUBLIC])
      expect([list.alerts(), dialogButton('Confirm')]).toEqual([[UPDATED], null])
    })

    // Ended, the change can be asked for again: a refused one leaves its item in the menu, and it works.
    it('sends "Make private" again once the one before it was refused', async () => {
      let refuse = true
      server.on('PATCH', MAKE_PRIVATE, (_request, match) => {
        if (refuse) throw httpError(500)
        published.delete(match[2])

        return { status: 204 }
      })
      const list = await openList()
      await inDetail.open(list)
      await fileMenu(inDetail, 'Make private')
      expect([server.sent('PATCH', MAKE_PRIVATE).length, route(inDetail)]).toEqual([1, PUBLIC])

      refuse = false
      await fileMenu(inDetail, 'Make private')

      expect([server.sent('PATCH', MAKE_PRIVATE).length, route(inDetail), reads()]).toEqual([2, PRIVATE, [0, 2, 0]])
      expect(list.alerts()).toEqual([SYSTEM_ERROR])
    })
  })

  /* Each kind of file is made private by a request of its own, and core-dam answers them differently: 204 with no
   * body for an image and a document, 200 with the file for an audio. Either is the change gone through. */
  it.each(kinds.flatMap((kind) => places.map(([where, place]): [Kind, string, Place] => [kind, where, place])))(
    'follows a file of the kind "%s" made private, in %s: the card says so, and nothing is said of an error',
    async (kind, _where, place) => {
      secondIs = kind
      const list = await openList()
      await place.open(list)

      await fileMenu(place, 'Make private')

      expect(server.sent('PATCH', MAKE_PRIVATE).map((request) => request.url)).toEqual([
        `/adm/v1/${kind}/file-2/make-private`,
      ])
      expect([route(place), reads(), list.alerts(), menu()]).toEqual([PRIVATE, [0, 2, 0], [], null])
    }
  )

  // Which of the two a server answers with is its own matter, and differs between the kinds today: either is done.
  it.each(kinds.flatMap((kind) => [200, 204].map((status): [Kind, number] => [kind, status])))(
    'takes a file of the kind "%s" for made private when the answer is %i',
    async (kind, status) => {
      secondIs = kind
      server.on('PATCH', MAKE_PRIVATE, (_request, match) => {
        published.delete(match[2])

        return status === 200 ? { status, data: { id: match[2] } } : { status }
      })
      const list = await openList()
      await inPanel.open(list)

      await fileMenu(inPanel, 'Make private')

      expect([route(inPanel), reads(), list.alerts()]).toEqual([PRIVATE, [0, 2, 0], []])
    }
  )

  // A file made public is answered with 200 and its route for every kind: the one message is the one of the dialog.
  it.each(kinds)('follows a file of the kind "%s" made public: the card says so', async (kind) => {
    secondIs = kind
    published.delete('file-2')
    const list = await openList()
    await inDetail.open(list)

    await makePublic(inDetail)

    expect(server.sent('PATCH', MAKE_PUBLIC).map((request) => request.url)).toEqual([
      `/adm/v1/${kind}/file-2/make-public`,
    ])
    expect([route(inDetail), reads(), list.alerts(), menu()]).toEqual([PUBLIC, [0, 2, 0], [UPDATED], null])
  })

  /* The route is all the change touched, and all that is taken while metadata are not saved. The file of an asset
   * just uploaded can still be on its way through the server as the form is read: "Save" is held back then, since
   * the server may yet fill in the metadata from the file, and a form read before that would overwrite them. */
  it.each(places)(
    'gives %s the route alone: a file not yet processed as the form was read stays so, and "Save" held back',
    async (_where, place) => {
      secondFileIs = 'stored'
      const list = await openList()
      await place.open(list)
      await typeTitle(place, TYPED)
      const save = () =>
        place === inDetail
          ? detail()!.querySelector<HTMLButtonElement>('[data-cy="button-save"]')!
          : buttonsNamed(panel(), 'Save')[0]
      const heldBack = () => [save().disabled, place.form()?.textContent?.includes(STILL_PROCESSED)]
      expect(heldBack()).toEqual([true, true])
      // The server has processed the file by the time the route is changed.
      secondFileIs = 'processed'

      await fileMenu(place, 'Make private')

      expect([route(place), reads(), list.alerts()]).toEqual([PRIVATE, [0, 2, 0], []])
      expect(heldBack()).toEqual([true, true])
    }
  )

  it.each(places)(
    'leaves %s as it is when the read fails while metadata typed into it are not saved, and says so',
    async (_where, place) => {
      const list = await openList()
      await place.open(list)
      const typedInto = await typeTitle(place, TYPED)
      const before = address()
      server.assetBy('asset-2', () => {
        throw httpError(500)
      })

      await fileMenu(place, 'Make private')
      await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))

      expect([title(place) === typedInto, typedInto.isConnected, typedInto.value]).toEqual([true, true, TYPED])
      // The card is as old as the form: the change went through, and the read that would show it did not.
      expect([route(place), held(place), reads(), address()]).toEqual([
        PUBLIC,
        ['asset-2', 'file-2'],
        [0, 2, 0],
        before,
      ])
      expect([list.active(), standsOut(buttonsNamed(panel(), 'Save')[0])]).toEqual([[false, true, false], true])
      if (place === inDetail) expect(shown()).toBe('2 / 3 asset-2')
    }
  )

  it.each(places)('empties %s when the read fails and nothing was typed into it, as it did', async (_where, place) => {
    const list = await openList()
    await place.open(list)
    server.assetBy('asset-2', () => {
      throw httpError(500)
    })

    await fileMenu(place, 'Make private')
    await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))

    expect([detail(), panel().textContent?.trim(), address()]).toEqual([null, 'No asset selected', LIST])
  })

  /* Metadata that were typed and are left by "Leave anyway": the asset is read without a loader, and its answer can
   * come once the form holds the next asset. */
  it.each(places)('writes nothing into %s once it holds another asset', async (_where, place) => {
    const list = await openList()
    await place.open(list)
    await typeTitle(place, TYPED)
    const answerRead = holdRead('asset-2')
    await fileMenu(place, 'Make private')
    await menuIsClosed()
    expect(reads()).toEqual([0, 2, 0])

    await place.toTheThird(list)
    await leaveAnyway()
    await eventually(() => expect(held(place)).toEqual(['asset-3', 'file-3']))
    await answerRead()

    expect([held(place), route(place), title(place)?.value, questions()]).toEqual([
      ['asset-3', 'file-3'],
      PUBLIC,
      FROM_SERVER,
      [],
    ])
  })

  /* Closing the detail leaves its asset, with what was typed, in the panel beside the list: it is still the asset
   * the answer was read for, and the panel is where its file shows. */
  it('gives the file to the panel when the detail was closed over the read: what was typed is there', async () => {
    const list = await openList()
    await inDetail.open(list)
    await typeTitle(inDetail, TYPED)
    const answerRead = holdRead('asset-2')
    await fileMenu(inDetail, 'Make private')
    await menuIsClosed()

    detail()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
    await eventually(() => expect(detail()).toBeNull())
    await answerRead()

    expect([held(inPanel), route(inPanel), title(inPanel)?.value, reads()]).toEqual([
      ['asset-2', 'file-2'],
      PRIVATE,
      TYPED,
      [0, 2, 0],
    ])
    expect([standsOut(buttonsNamed(panel(), 'Save')[0]), address()]).toEqual([true, LIST])
  })

  /* Nor into the same asset read anew meanwhile: that read is the newer one. Here the file is public again by the
   * time of the newer read, and the older answer, of the private file, comes last. */
  it('writes nothing into the panel once its asset was read anew meanwhile', async () => {
    const list = await openList()
    await inPanel.open(list)
    await typeTitle(inPanel, TYPED)
    // The first read from now on is held, every later one answers at once.
    let answerOlder: (asset: unknown) => void = () => undefined
    const answers = [() => new Promise((resolve) => (answerOlder = resolve))]
    server.assetBy('asset-2', () => (answers.shift() ?? (() => onServer('asset-2')))())
    await fileMenu(inPanel, 'Make private')
    await menuIsClosed()
    expect(reads()).toEqual([0, 2, 0])
    const asRead = onServer('asset-2')
    expect(asRead).toMatchObject({ mainFile: { mainRoute: null } })
    published.add('file-2')

    // The tile of the asset itself, long enough after its read: read anew, once told to leave what was typed.
    await later()
    await list.pick(1)
    await leaveAnyway()
    expect([reads(), route(inPanel), title(inPanel)?.value]).toEqual([[0, 3, 0], PUBLIC, FROM_SERVER])

    answerOlder(asRead)
    await settled()

    expect([route(inPanel), title(inPanel)?.value]).toEqual([PUBLIC, FROM_SERVER])
  })

  /** Whether metadata are typed into the form before the change, and what its title says after it. */
  const forms: Array<[string, boolean, string]> = [
    ['nothing typed', false, FROM_SERVER],
    ['metadata typed and not saved', true, TYPED],
  ]

  /* The place of the active tile outlives a list read anew: the tile at that place is then of another asset, and it
   * was that one that was read into the panel. */
  it.each(forms)(
    'is the asset the panel holds, not the one at the place of the active tile: with %s',
    async (_form, typed, after) => {
      const list = await openList()
      await inPanel.open(list)
      if (typed) await typeTitle(inPanel, TYPED)
      await list.readAnew(['asset-1', 'asset-3', 'asset-2'])

      await fileMenu(inPanel, 'Make private')

      expect([held(inPanel), route(inPanel), reads()]).toEqual([['asset-2', 'file-2'], PRIVATE, [0, 2, 0]])
      expect(title(inPanel)?.value).toBe(after)
    }
  )

  // The detail of a row of the upload queue is of no tile; the first tile is the active one here.
  it.each(forms)(
    'is the asset the detail holds, not the one of the active tile: with %s',
    async (_form, typed, after) => {
      const list = await openList()
      await list.pick(0)
      await list.editUploaded()
      expect([held(inDetail), route(inDetail)]).toEqual([[UPLOADED, 'file-9'], PUBLIC])
      if (typed) await typeTitle(inDetail, TYPED)

      await fileMenu(inDetail, 'Make private')

      expect([held(inDetail), route(inDetail)]).toEqual([[UPLOADED, 'file-9'], PRIVATE])
      expect([reads(), server.assetReads(UPLOADED), title(inDetail)?.value]).toEqual([[1, 0, 0], 2, after])
    }
  )

  /* The form that tells of a change is drawn only while an asset is held, so the page cannot be brought here by its
   * buttons: the list is told of a change as the form tells it, after the detail was emptied as a failed read
   * empties it. The second tile is still the active one. */
  it('is none while the detail holds no asset', async () => {
    const list = await openList()
    await inPanel.open(list)
    const { useAssetListActions } = await import('@/domains/coreDam/asset/components/list/composables/assetListActions')
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    let mainRouteChanged: () => Promise<void> = async () => undefined
    await list.mount(async () => ({
      default: defineComponent({
        setup: () => {
          mainRouteChanged = useAssetListActions().refreshActiveItem

          return () => null
        },
      }),
    }))
    useAssetDetailStore().reset()

    await mainRouteChanged()
    await settled()

    expect([reads(), panel().textContent?.trim(), list.active()]).toEqual([
      [0, 1, 0],
      'No asset selected',
      [false, true, false],
    ])
  })
})
