import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, forbiddenOperationError, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer, FakeDamMethod } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/* What the detail of an asset does with the files of the asset: the slots of the asset (which file is the main one,
 * a file put into another slot, taken out of one, deleted), an image turned, the preview image of a video, a file
 * downloaded. Each is a request of its own, and one that fails says so: most of them reject with what axios threw,
 * which the alerts do not know for an error, and said nothing. The real page of the list with its real detail, the
 * application around it as it starts; the server is a fake, and so is the address the page asks about a new version
 * of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const TYPE = '(image|audio|video|document)'
const MAIN = new RegExp(`^/adm/v1/${TYPE}/([^/]+)/asset/([^/]+)/main$`)
const SLOT = new RegExp(`^/adm/v1/${TYPE}/([^/]+)/asset/([^/]+)/slot-name/([^/]+)$`)
const FILE = new RegExp(`^/adm/v1/${TYPE}/([^/]+)$`)
const DOWNLOAD_LINK = new RegExp(`^/adm/v1/${TYPE}/([^/]+)/download-link$`)
const ROTATE = /^\/adm\/v1\/image\/([^/]+)\/rotate\/(90|270)$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const FORBIDDEN = "Access denied, you don't have correct rights for this action"

const LIST = '/assets'
const VIDEO = 'asset-1'
const AUDIO = 'asset-2'
const IMAGE = 'asset-3'
const KIND: Record<string, string> = { [VIDEO]: 'video', [AUDIO]: 'audio', [IMAGE]: 'image' }

/* What the server holds of each asset: the file of each of its slots by the name of the slot, and which of its
 * files is the main one. The audio has one file alone in a slot and another in two; the image and the video have
 * one file each. */
let slots: Record<string, Record<string, string | null>> = {}
let main: Record<string, string> = {}
/** The preview image the server holds for the file of the video. */
let preview: { imageFile: string; position: number } | null = null

/** What core-dam says of a file by its kind, as far as the detail reads it. */
const ofKind = (): Record<string, Record<string, unknown>> => ({
  video: {
    _resourceName: 'videoFile',
    videoAttributes: { duration: 1000, bitrate: 1000, codecName: 'h264' },
    imagePreview: preview,
  },
  audio: { _resourceName: 'audioFile', audioAttributes: { duration: 1000, bitrate: 1000, codecName: 'mp3' } },
  image: {
    _resourceName: 'imageFile',
    imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  },
})

const fileOf = (assetId: string, fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: assetId }),
  ...ofKind()[KIND[assetId]],
})

/** An asset as the server holds it now. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: KIND[id], assetStatus: 'with_file' },
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

/** In the place of the watcher of the browser: whatever is watched for coming into view is in view at once, so a
 * picture is drawn with its address. */
class InView {
  private readonly seen: IntersectionObserverCallback

  constructor(seen: IntersectionObserverCallback) {
    this.seen = seen
  }

  observe(target: Element) {
    queueMicrotask(() => this.seen([{ isIntersecting: true, target } as IntersectionObserverEntry], this as never))
  }

  unobserve() {}

  disconnect() {}
}

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** The asset the open detail holds, as the file panel of its form says it. */
const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

/** What a row of the Slots tab says first: the name of its slot, and its file or that it has none. */
const said = (row: HTMLElement) =>
  Array.from(row.querySelectorAll('.v-col:first-child > div'))
    .slice(0, 2)
    .map((line) => line.textContent?.replace(/\s+/g, ' ').trim())
    .join(': ')
/** The rows of the slots; the tab of an audio and of a video has one more above them, of the sibling of the asset. */
const slotRows = () =>
  Array.from(detail()?.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8') ?? []).filter(
    (row) => !said(row).startsWith('Sibling')
  )
const slotsShown = () => slotRows().map(said)
const slotRow = (name: string) => slotRows().find((row) => said(row).startsWith(name))!

/** The item of the menu of the row of the slot, by what it says. */
const slotMenuItem = async (slotName: string, name: string) => {
  slotRow(slotName).querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()

  return eventually(() => {
    const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
      (listed) => listed.textContent?.trim() === name
    )
    expect(found).toBeTruthy()

    return found!
  })
}

/** The page of the list with its three assets, and the detail of one of them opened by the pencil of its tile. */
const openDetail = async (assetId: string) => {
  const ui = await startUploadUi({
    server,
    grants: [
      'dam_asset_update',
      'dam_audio_update',
      'dam_audio_delete',
      'dam_image_update',
      'dam_image_delete',
      'dam_video_update',
    ],
    extSystem: {
      audio: { slots: ['default', 'free', 'bonus', 'spare'] },
      image: { slots: ['default', 'extra'] },
      video: { slots: ['default'] },
    },
    customForm: { video: [customField('title')], audio: [customField('title')], image: [customField('title')] },
  })
  // The user as the bar of the page draws them, and as the picker of images of the library asks about them.
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
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(3)

    return found
  })
  tiles[[VIDEO, AUDIO, IMAGE].indexOf(assetId)].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(held()).toBe(assetId))

  return {
    ...ui,
    /** The tab of the detail, by its mark: opened, and what it reads answered. */
    openTab: async (mark: string) => {
      detail()!.querySelector<HTMLElement>(`[data-cy="${mark}"]`)!.click()
      await settled()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  slots = {
    [VIDEO]: { default: 'file-1' },
    [AUDIO]: { default: 'file-a', free: 'file-b', bonus: 'file-b', spare: null },
    [IMAGE]: { default: 'file-3', extra: null },
  }
  main = { [VIDEO]: 'file-1', [AUDIO]: 'file-a', [IMAGE]: 'file-3' }
  preview = { imageFile: 'image-saved', position: 0 }
  const listed = [VIDEO, AUDIO, IMAGE]
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
  /* The four changes of a slot, as core-dam answers them: 200 with the file for a file made the main one and for a
   * file put into a slot, 204 for a file taken out of a slot and for a file deleted. A file is not taken out of a
   * slot that does not hold it. */
  server.on('PATCH', MAIN, (_request, match) => {
    main[match[3]] = match[2]

    return { status: 200, data: fileOf(match[3], match[2]) }
  })
  server.on('PATCH', SLOT, (_request, match) => {
    slots[match[3]][match[4]] = match[2]

    return { status: 200, data: fileOf(match[3], match[2]) }
  })
  server.on('DELETE', SLOT, (_request, match) => {
    if (slots[match[3]][match[4]] !== match[2]) throw httpError(404)
    slots[match[3]][match[4]] = null

    return { status: 204 }
  })
  server.on('DELETE', FILE, (_request, match) => {
    const of = Object.values(slots).find((assetSlots) => Object.values(assetSlots).includes(match[2]))
    if (!of) throw httpError(404)
    for (const slotName of Object.keys(of)) if (of[slotName] === match[2]) of[slotName] = null

    return { status: 204 }
  })
  // The region of interest of the image, as its tab reads it: none set.
  server.on('GET', /^\/adm\/v1\/image\/[^/]+\/roi$/, empty)
  // The file of the video with its preview image, as the tab of the preview reads them, and the save of another.
  server.fileBy('video', 'file-1', () => fileOf(VIDEO, 'file-1'))
  server.file('image', { ...assetFile('image-saved'), ...ofKind().image } as never)
  // The file of the image, as the row of its slot reads it to draw it.
  server.fileBy('image', 'file-3', () => fileOf(IMAGE, 'file-3'))
  server.on('PUT', /^\/adm\/v1\/video\/([^/]+)$/, (request, match) => {
    preview = JSON.parse(request.data as string).imagePreview

    return { status: 200, data: fileOf(VIDEO, match[1]) }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/** A change of a slot of the audio, as the Slots tab of its detail offers it. */
interface SlotChange {
  /** Brings what sends the change into view - an item of the menu of a row, or a button of the dialog it opens. */
  toSend: () => Promise<HTMLElement>
  method: FakeDamMethod
  pattern: RegExp
  url: string
  /** What the rows of the tab say once it went through. */
  after: string[]
}

const BEFORE = ['default (Main file): file-a', 'free: file-b', 'bonus: file-b', 'spare: No file']

/** The button of the dialog the item "Remove" of the row opens. */
const removeButton = async (slotName: string, mark: 'button-unset' | 'button-remove') => {
  ;(await slotMenuItem(slotName, 'Remove')).click()

  return eventually(() => {
    const button = document.body.querySelector<HTMLButtonElement>(`.v-dialog [data-cy="${mark}"]`)
    expect(button).not.toBeNull()

    return button!
  })
}

const slotChanges: Array<[string, SlotChange]> = [
  [
    '"Make main file"',
    {
      toSend: () => slotMenuItem('free', 'Make main file'),
      method: 'PATCH',
      pattern: MAIN,
      url: '/adm/v1/audio/file-b/asset/asset-2/main',
      after: ['default: file-a', 'free (Main file): file-b', 'bonus (Main file): file-b', 'spare: No file'],
    },
  ],
  [
    'a file taken out of one of its slots',
    {
      toSend: () => removeButton('free', 'button-unset'),
      method: 'DELETE',
      pattern: SLOT,
      url: '/adm/v1/audio/file-b/asset/asset-2/slot-name/free',
      after: ['default (Main file): file-a', 'free: No file', 'bonus: file-b', 'spare: No file'],
    },
  ],
  [
    'a file deleted',
    {
      toSend: () => removeButton('free', 'button-remove'),
      method: 'DELETE',
      pattern: FILE,
      url: '/adm/v1/audio/file-b',
      after: ['default (Main file): file-a', 'free: No file', 'bonus: No file', 'spare: No file'],
    },
  ],
  [
    'a file put into another slot',
    {
      toSend: async () => {
        ;(await slotMenuItem('default', 'Duplicate to another slot')).click()
        const select = await eventually(() => {
          const field = document.body.querySelector<HTMLElement>('.v-dialog [data-cy="button-choose-slot"] .v-field')
          expect(field).not.toBeNull()

          return field!
        })
        select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        const spare = await eventually(() => {
          const option = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
            (item) => item.textContent?.trim() === 'spare'
          )
          expect(option).toBeTruthy()

          return option!
        })
        spare.click()
        await settled()

        return document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-unset"]')!
      },
      method: 'PATCH',
      pattern: SLOT,
      url: '/adm/v1/audio/file-a/asset/asset-2/slot-name/spare',
      after: ['default (Main file): file-a', 'free: file-b', 'bonus: file-b', 'spare (Main file): file-a'],
    },
  ],
]

/** The Slots tab of the detail of the audio, its rows drawn. */
const openSlots = async (assetId = AUDIO) => {
  const ui = await openDetail(assetId)
  await ui.openTab('button-slots')
  await eventually(() => expect(slotsShown().length).toBeGreaterThan(0))

  return ui
}

describe('a change of a slot of an asset, from the Slots tab of its detail', () => {
  it.each(slotChanges)('says once that %s did not go through, and reads the slots again', async (_what, change) => {
    server.on(change.method, change.pattern, () => {
      throw httpError(500)
    })
    const ui = await openSlots()
    expect(slotsShown()).toEqual(BEFORE)
    const slotsRead = server.slotReads(AUDIO)

    ;(await change.toSend()).click()
    await settled()

    expect(server.sent(change.method, change.pattern).map((request) => request.url)).toEqual([change.url])
    expect([ui.alerts(), slotsShown(), server.slotReads(AUDIO) - slotsRead]).toEqual([[SYSTEM_ERROR], BEFORE, 1])
  })

  /* The loader of the tab takes the rows away, with their menus and their dialogs, as the change is sent - but only
   * once the tab is drawn again: pressed twice before that, the change was sent twice, and the second of them
   * refused over the first that went through. */
  it.each(slotChanges)(
    'sends %s once however fast it is pressed again, and says nothing of an error once it went through',
    async (_what, change) => {
      const ui = await openSlots()
      const send = await change.toSend()

      send.click()
      send.click()
      await eventually(() => expect(slotsShown()).toEqual(change.after))

      expect(server.sent(change.method, change.pattern).map((request) => request.url)).toEqual([change.url])
      expect(ui.alerts()).toEqual([])
    }
  )

  // The requests take one answer for done, and reject with nothing at all when another comes.
  it('says once that a change did not go through when its answer is not the one it is known by', async () => {
    server.on('PATCH', MAIN, () => ({ status: 202, data: {} }))
    const ui = await openSlots()

    ;(await slotMenuItem('free', 'Make main file')).click()
    await settled()

    expect([ui.alerts(), slotsShown()]).toEqual([[SYSTEM_ERROR], BEFORE])
  })

  /* Nor is every failure an answer of the status 500: a request the server did not answer at all rejects with an
   * error that carries no answer, and a refusal of an operation comes as a 422 with a body of its own. */
  it.each<[string, () => unknown]>([
    ['the server did not answer at all', () => new AxiosError('Network Error', 'ERR_NETWORK')],
    ['the server refused the operation with a 422', () => forbiddenOperationError('asset_file_not_processed')],
  ])('says once that a change did not go through when %s, and reads the slots again', async (_how, failure) => {
    server.on('PATCH', MAIN, () => {
      throw failure()
    })
    const ui = await openSlots()
    const slotsRead = server.slotReads(AUDIO)

    ;(await slotMenuItem('free', 'Make main file')).click()
    await settled()

    expect([ui.alerts(), slotsShown(), server.slotReads(AUDIO) - slotsRead]).toEqual([[SYSTEM_ERROR], BEFORE, 1])
  })

  /* The file of an image is deleted by a request of the library, whose errors the alerts know: a refusal is said in
   * its own words, and is not followed by the general message. */
  it('says a refused delete of the file of an image once, in the words of the refusal', async () => {
    server.on('DELETE', FILE, () => {
      throw httpError(403)
    })
    const ui = await openSlots(IMAGE)
    expect(slotsShown()).toEqual(['default (Main file): file-3', 'extra: No file'])

    ;(await removeButton('default', 'button-remove')).click()
    await settled()

    expect(server.sent('DELETE', FILE).map((request) => request.url)).toEqual(['/adm/v1/image/file-3'])
    expect([ui.alerts(), slotsShown()]).toEqual([[FORBIDDEN], ['default (Main file): file-3', 'extra: No file']])
  })
})

describe('a file downloaded from the detail of its asset', () => {
  const SIGNED = 'https://storage.test/file?signature=1'

  /* "Download" of the menu of a slot asks for the address of the file and opens it in a tab of its own: opened at the
   * press, empty, and sent to the address once it is had, or closed when it is not. */
  it('says that the address of the file of a slot could not be had, and opens the file once it can', async () => {
    const tabs: Array<{ opener: unknown; closed: boolean; sentTo: string[] }> = []
    const opened = vi.spyOn(window, 'open').mockImplementation(() => {
      const tab = {
        opener: window as unknown,
        closed: false,
        sentTo: [] as string[],
        close: () => void (tab.closed = true),
        location: { href: 'about:blank', replace: (to: string) => void tab.sentTo.push(to) },
      }
      tabs.push(tab)

      return tab as unknown as Window
    })
    let refuse = true
    server.on('GET', DOWNLOAD_LINK, () => {
      if (refuse) throw httpError(500)

      return { status: 200, data: { link: SIGNED } }
    })
    const ui = await openSlots()
    const download = await slotMenuItem('free', 'Download')

    download.click()
    await settled()

    expect(server.sent('GET', DOWNLOAD_LINK).map((request) => request.url)).toEqual([
      '/adm/v1/audio/file-b/download-link',
    ])
    expect([
      ui.alerts(),
      opened.mock.calls,
      tabs.map(({ opener, closed, sentTo }) => [opener, closed, sentTo]),
    ]).toEqual([[SYSTEM_ERROR], [['', '_blank']], [[null, true, []]]])

    refuse = false
    download.click()
    await settled()

    expect([ui.alerts(), opened.mock.calls.length, tabs[1].closed, tabs[1].sentTo]).toEqual([
      [SYSTEM_ERROR],
      2,
      false,
      [SIGNED],
    ])
  })

  /* The download button of the Info tab opens a dialog that asks for the address of the main file, and shows a link
   * to it: while it asks, a spinner. A request that failed left the spinner turning for good. */
  it('stops waiting for the address of the main file that could not be had, and says so', async () => {
    let refuse = true
    server.on('GET', DOWNLOAD_LINK, () => {
      if (refuse) throw httpError(500)

      return { status: 200, data: { link: SIGNED } }
    })
    const ui = await openDetail(AUDIO)
    const dialog = () => document.body.querySelector<HTMLElement>('.v-dialog [data-cy="delete-panel"]')
    const shows = () => ({
      waiting: !!dialog()?.querySelector('.v-progress-circular'),
      link: dialog()?.querySelector('[data-cy="button-download-file"]')?.getAttribute('href') ?? null,
    })

    detail()!.querySelector<HTMLButtonElement>('[data-cy="button-download"]')!.click()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect(server.sent('GET', DOWNLOAD_LINK).map((request) => request.url)).toEqual([
      '/adm/v1/audio/file-a/download-link',
    ])
    expect(shows()).toEqual({ waiting: false, link: null })

    // Closed and opened again once the server answers: the link, and nothing more said.
    refuse = false
    dialogButton('Close')!.click()
    await eventually(() => expect(dialog()).toBeNull())
    detail()!.querySelector<HTMLButtonElement>('[data-cy="button-download"]')!.click()
    await eventually(() => expect(shows()).toEqual({ waiting: false, link: SIGNED }))
    expect(ui.alerts()).toEqual([SYSTEM_ERROR])
  })
})

describe('an image turned, from the Focus tab of its detail', () => {
  it('says once that it was not turned, and that it was once it is', async () => {
    let refuse = true
    server.on('PATCH', ROTATE, (_request, match) => {
      if (refuse) throw httpError(500)

      return { status: 200, data: fileOf(IMAGE, match[1]) }
    })
    const ui = await openDetail(IMAGE)
    await ui.openTab('button-focus')
    const turn = () => detail()!.querySelector<HTMLButtonElement>('[data-cy="button-rotate-right"]')
    await eventually(() => expect(turn()).not.toBeNull())

    turn()!.click()
    await settled()

    expect(server.sent('PATCH', ROTATE).map((request) => request.url)).toEqual(['/adm/v1/image/file-3/rotate/90'])
    // The two buttons are back in the place of the spinner.
    expect([ui.alerts(), turn() === null]).toEqual([[SYSTEM_ERROR], false])

    refuse = false
    turn()!.click()
    await settled()

    expect([ui.alerts(), turn() === null]).toEqual([[SYSTEM_ERROR, UPDATED], false])
  })
})

/* The card of the preview image shows an image as soon as it is picked or taken away, and saves it then: after a save
 * that failed it went on showing what was not saved, until the detail was opened again. An image is taken away by a
 * button of the card, and picked in the dialog of the library, from the list of the assets of the licence. */
describe('the preview image of a video, from the Image preview tab of its detail', () => {
  const PREVIEW = /^\/adm\/v1\/video\/file-1$/
  const SAVED = /^\/adm\/v1\/image\/image-saved$/
  const PICKED = { imageFile: 'file-3', position: 0 }

  /** The card: whether it has an image to take away, and how many times it asked for the saved image. */
  const card = () => ({
    image: buttonsNamed(detail()!, 'Unassign image').length === 1,
    asked: server.sent('GET', SAVED).length,
  })

  /** Whether the picture the card draws is the one of the file of the third asset: drawn by its address. */
  const pictureOfPicked = () =>
    !!detail()!.querySelector('.sidebar-info__content .v-img__img')?.getAttribute('src')?.includes('file-3')

  /** Whether the picture the card draws is the one of the saved image: drawn by its address. */
  const pictureOfSaved = () =>
    !!detail()!.querySelector('.sidebar-info__content .v-img__img')?.getAttribute('src')?.includes('image-saved')

  /** What the server was asked to save as the preview image, save by save. */
  const saved = () => server.sent('PUT', PREVIEW).map((request) => JSON.parse(request.data as string).imagePreview)

  /** The tab of the video, its card drawn; a picture is drawn with its address as soon as it would come into view. */
  const openPreview = async () => {
    vi.stubGlobal('IntersectionObserver', InView)
    const ui = await openDetail(VIDEO)
    await ui.openTab('button-image-preview')
    await eventually(() => expect(buttonsNamed(detail()!, 'Select image')).toHaveLength(1))

    return ui
  }

  const takeAway = () => buttonsNamed(detail()!, 'Unassign image')[0].click()

  /** The file of the third asset of the list, an image, picked in the dialog of the library: the card shows it. */
  const pickThird = async () => {
    buttonsNamed(detail()!, 'Select image')[0].click()
    const picker = () => document.body.querySelector<HTMLElement>('.subject-select.v-overlay--active')
    const tile = await eventually(() => {
      const found = Array.from(picker()?.querySelectorAll<HTMLElement>('.asset-list-tiles__item') ?? []).at(2)
      expect(found).toBeTruthy()

      return found!
    })
    tile.click()
    await settled()
    buttonsNamed(picker()!, 'Confirm')[0].click()
    await eventually(() => expect(pictureOfPicked()).toBe(true))
  }

  it('goes back to the saved image after a save that failed, and says so once', async () => {
    server.on('PUT', PREVIEW, () => {
      throw httpError(500)
    })
    const ui = await openPreview()
    expect(card()).toEqual({ image: true, asked: 1 })

    takeAway()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect(server.sent('PUT', PREVIEW).map((request) => JSON.parse(request.data as string))).toEqual([
      { id: 'file-1', imagePreview: null },
    ])
    // The image is there to be taken away again, with its picture: the one the card had read, not asked for anew.
    await eventually(() => expect([card(), pictureOfSaved()]).toEqual([{ image: true, asked: 1 }, true]))
  })

  /* The same for an image picked for a file that had none: the card shows the picture of an image only while it
   * holds one. */
  it('goes back to no image after the save of a picked one failed', async () => {
    preview = null
    let refuse: () => void = () => undefined
    server.on(
      'PUT',
      PREVIEW,
      () => new Promise<FakeDamAnswer>((_resolve, reject) => (refuse = () => reject(httpError(500))))
    )
    const ui = await openPreview()
    expect([card().image, pictureOfPicked()]).toEqual([false, false])

    await pickThird()

    // Shown as picked while it is being saved.
    expect([saved(), card().image]).toEqual([[PICKED], true])

    refuse()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([card().image, pictureOfPicked()]).toEqual([false, false])
  })

  it('keeps the card as it was changed once the save went through, and says nothing of an error', async () => {
    const ui = await openPreview()

    takeAway()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))

    expect([card(), preview]).toEqual([{ image: false, asked: 1 }, null])
  })

  // What is saved is what the last save that went through sent, not what the tab was opened with.
  it('goes back to the image saved last: to none, once the image the tab opened with was taken away', async () => {
    const ui = await openPreview()
    takeAway()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    let refuse: () => void = () => undefined
    server.on(
      'PUT',
      PREVIEW,
      () => new Promise<FakeDamAnswer>((_resolve, reject) => (refuse = () => reject(httpError(500))))
    )

    await pickThird()
    refuse()
    await eventually(() => expect(ui.alerts()).toContain(SYSTEM_ERROR))

    expect([saved(), card(), pictureOfPicked()]).toEqual([[null, PICKED], { image: false, asked: 1 }, false])
  })

  /* The card can be changed again while a save is on its way. The saves go one after the other, in the order of the
   * changes, and a save that failed does not put the card back over a change made since: that one is saved next. */
  it('saves a second change after the first, and keeps it when the first of them failed', async () => {
    const answers: Array<(went: boolean) => void> = []
    server.on(
      'PUT',
      PREVIEW,
      (request) =>
        new Promise<FakeDamAnswer>((resolve, reject) => {
          answers.push((went) => {
            if (!went) return reject(httpError(500))
            preview = JSON.parse(request.data as string).imagePreview
            resolve({ status: 200, data: fileOf(VIDEO, 'file-1') })
          })
        })
    )
    const ui = await openPreview()

    takeAway()
    await settled()
    await pickThird()
    await settled()

    // The second waits for the first.
    expect(saved()).toEqual([null])

    answers[0](false)
    await eventually(() => expect(saved()).toEqual([null, PICKED]))

    expect([ui.alerts(), card().image, pictureOfPicked()]).toEqual([[SYSTEM_ERROR], true, true])

    answers[1](true)
    await eventually(() => expect(ui.alerts()).toContain(UPDATED))

    expect([card().image, pictureOfPicked(), preview]).toEqual([true, true, PICKED])
  })
})
