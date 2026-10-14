import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The card of the preview image of a video, in the Image preview tab of the detail of its asset, and what it reads:
 * the file of the slot the select above it says, with the preview image the server holds for that file, and the
 * picture of that image. A read can fail, two of them can be answered in the other order, and the image can be set
 * from outside of the card, by the dialog that picks it from a distribution. The real page of the list with its real
 * detail, the application around it as it starts; the server is a fake, and so is the address the page asks about a
 * new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const PREVIEW = /^\/adm\/v1\/video\/([^/]+)$/
const FROM_DISTRIBUTION = /^\/adm\/v1\/video\/([^/]+)\/distribution-preview\/([^/]+)$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const IS_PROCESSING = 'Image is processing, please check again later'

const LIST = '/assets'
const VIDEO = 'asset-1'
const IMAGE = 'asset-2'
/** The files of the two slots of the video, "default" and "extra", and the file of the image. */
const FIRST = 'video-1'
const SECOND = 'video-2'
const OF_IMAGE = 'file-3'
/** The image the server makes of a frame of a distribution of the video. */
const OF_DISTRIBUTION = 'image-of-distribution'

type Preview = { imageFile: string; position: number } | null
const SAVED: Preview = { imageFile: 'image-saved', position: 0 }

/** The preview image the server holds for each of the two files of the video. */
let previews: Record<string, Preview> = {}

const imageFile = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: IMAGE }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
})

const videoFile = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: VIDEO }),
  _resourceName: 'videoFile',
  videoAttributes: { duration: 1000, bitrate: 1000, codecName: 'h264' },
  imagePreview: previews[fileId],
})

/** An asset as the server holds it now. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: id === VIDEO ? 'video' : 'image', assetStatus: 'with_file' },
    mainFile: id === VIDEO ? videoFile(FIRST) : imageFile(OF_IMAGE),
  }),
  keywords: [],
  authors: [],
})

const slotsOfVideo = () => {
  const data = Object.entries({ default: FIRST, extra: SECOND }).map(([slotName, fileId]) => ({
    id: 'slot-' + slotName,
    slotName,
    default: slotName === 'default',
    main: fileId === FIRST,
    assetFile: videoFile(fileId),
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

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const tabOfPreview = () => detail()!.querySelector<HTMLElement>('.sidebar-info__content')!
const picker = () => document.body.querySelector<HTMLElement>('.subject-select.v-overlay--active')

/** The tab: whether it draws a card, with which buttons, whose picture - told by its address - and whether anything
 * in it still spins or says that the image is being processed. */
const tab = () => {
  const src = tabOfPreview().querySelector('.v-img__img')?.getAttribute('src') ?? ''

  return {
    buttons: ['Unassign image', 'Select image', 'Choose from distribution'].filter(
      (name) => buttonsNamed(tabOfPreview(), name).length === 1
    ),
    picture: [SAVED!.imageFile, OF_IMAGE, OF_DISTRIBUTION].find((fileId) => src.includes(fileId)) ?? 'none',
    spins: !!tabOfPreview().querySelector('.v-progress-circular'),
    saysProcessing: !!tabOfPreview().textContent?.includes(IS_PROCESSING),
  }
}

/** The card of a file with no image, of a file with the saved image, and no card at all. */
const NO_IMAGE = {
  buttons: ['Select image', 'Choose from distribution'],
  picture: 'none',
  spins: false,
  saysProcessing: false,
}
const WITH_SAVED = { ...NO_IMAGE, buttons: ['Unassign image', ...NO_IMAGE.buttons], picture: SAVED!.imageFile }
const NO_CARD = { ...NO_IMAGE, buttons: [] }

/** Which files of the video the server was asked for, read by read. */
const filesRead = () =>
  server
    .sent('GET')
    .map((request) => request.url.match(/^\/adm\/v1\/video\/([^/]+)$/)?.[1])
    .filter(Boolean)

/** What the server was asked to save as a preview image, save by save: for which file, and which image. */
const saves = () =>
  server.sent('PUT', PREVIEW).map((request) => [request.url, JSON.parse(request.data as string).imagePreview])

/* Every read of a file of the video is held from now on. Let go by the order they were asked in: answered with the
 * file as the server holds it then, or failed. */
const holdFileReads = () => {
  const answers: Array<(went: boolean) => void> = []
  for (const fileId of [FIRST, SECOND]) {
    server.fileBy(
      'video',
      fileId,
      () =>
        new Promise((resolve, reject) =>
          answers.push((went) => (went ? resolve(videoFile(fileId)) : reject(httpError(500))))
        )
    )
  }

  return async (asked: number, went = true) => {
    answers[asked](went)
    await settled()
  }
}

/** The tab of the preview image of the video opened, with what it reads on its way or answered. */
const openTab = async () => {
  // A picture is drawn with its address as soon as it would come into view.
  vi.stubGlobal('IntersectionObserver', InView)
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_video_update', 'dam_distribution_access'],
    extSystem: { image: { slots: ['default'] }, video: { slots: ['default', 'extra'] } },
    customForm: { video: [customField('title')], image: [customField('title')] },
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
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(2)

    return found
  })
  tiles[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim()).toBe(VIDEO))
  detail()!.querySelector<HTMLElement>('[data-cy="button-image-preview"]')!.click()
  await settled()

  return ui
}

/** The tab opened, the card of the file of the main slot drawn. */
const openPreview = async () => {
  const ui = await openTab()
  await eventually(() => expect(buttonsNamed(detail()!, 'Select image')).toHaveLength(1))

  return ui
}

/** The select above the card set to the slot: the card reads the file of that slot. */
const pickSlot = async (name: string) => {
  tabOfPreview()
    .querySelector('.v-select .v-field')!
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  const option = await eventually(() => {
    const found = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
      (item) => item.textContent?.trim() === name
    )
    expect(found).toBeTruthy()

    return found!
  })
  option.click()
  await settled()
}

/** The slot the select above the card says. */
const slotSaid = () => tabOfPreview().querySelector('.v-select .v-select__selection')?.textContent?.trim()

beforeEach(() => {
  server = createFakeDam()
  previews = { [FIRST]: SAVED, [SECOND]: null }
  for (const id of [VIDEO, IMAGE]) server.assetBy(id, () => onServer(id))
  server.slotsBy(VIDEO, slotsOfVideo)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [VIDEO, IMAGE].map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The files of the video with their preview images, as the tab reads them, and the images the card draws.
  for (const fileId of [FIRST, SECOND]) server.fileBy('video', fileId, () => videoFile(fileId))
  for (const fileId of [SAVED!.imageFile, OF_IMAGE, OF_DISTRIBUTION]) {
    server.fileBy('image', fileId, () => imageFile(fileId))
  }
  server.on('PUT', PREVIEW, (request, match) => {
    previews[match[1]] = JSON.parse(request.data as string).imagePreview

    return { status: 200, data: videoFile(match[1]) }
  })
  // The frames of the distributions of a file of the video, and one of them made its preview image.
  server.on('GET', /^\/adm\/v1\/video\/([^/]+)\/distribution-preview$/, () => ({
    status: 200,
    data: {
      data: [{ id: 'distribution-1', service: 'youtube', url: 'https://storage.test/frame.jpg' }],
      hasNextPage: false,
    },
  }))
  server.on('PATCH', FROM_DISTRIBUTION, (_request, match) => {
    previews[match[1]] = { imageFile: OF_DISTRIBUTION, position: 0 }

    return { status: 200, data: videoFile(match[1]) }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* A read that failed left the tab as it was while it read: spinning for good after a change of the slot, and for an
 * image saying for good that the image is being processed, with the buttons of the card hidden. */
describe('the card of the preview image of a video, when what it reads cannot be read', () => {
  it('stops spinning when the file of the slot picked cannot be read, says so once, and reads the next slot picked', async () => {
    const ui = await openPreview()
    expect(tab()).toEqual(WITH_SAVED)
    server.fileBy('video', SECOND, () => {
      throw httpError(500)
    })

    await pickSlot('extra')
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    // No card of the file of the slot before: under the select that says "extra" it would be saved into.
    expect([slotSaid(), tab()]).toEqual(['extra', NO_CARD])

    await pickSlot('default')
    await eventually(() => expect(tab()).toEqual(WITH_SAVED))
    expect([filesRead(), ui.alerts()]).toEqual([[FIRST, SECOND, FIRST], [SYSTEM_ERROR]])
  })

  it('stops spinning when the file of the main slot cannot be read as the tab is opened, and says so once', async () => {
    server.fileBy('video', FIRST, () => {
      throw httpError(500)
    })
    const ui = await openTab()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect(tab()).toEqual(NO_CARD)

    // The select is there for another slot: its file is read and drawn.
    await pickSlot('extra')
    await eventually(() => expect(tab()).toEqual(NO_IMAGE))
  })

  it('keeps its buttons when the image of the file cannot be read, says so once, and the image can be taken away', async () => {
    server.fileBy('image', SAVED!.imageFile, () => {
      throw httpError(500)
    })
    const ui = await openPreview()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    // Neither a picture nor how far the image is processed is known: the card says neither.
    expect(tab()).toEqual({ ...WITH_SAVED, picture: 'none' })

    buttonsNamed(detail()!, 'Unassign image')[0].click()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR, UPDATED]))
    expect([saves(), tab()]).toEqual([[['/adm/v1/video/' + FIRST, null]], NO_IMAGE])
  })

  /* The card holds the picture of the image it read last, and spun over it for good when the read of the image
   * picked next failed. */
  it('stops spinning when the picture of an image just picked cannot be read, and draws no picture of the one before', async () => {
    server.fileBy('image', OF_IMAGE, () => {
      throw httpError(500)
    })
    const ui = await openPreview()
    expect(tab()).toEqual(WITH_SAVED)

    buttonsNamed(detail()!, 'Select image')[0].click()
    const tile = await eventually(() => {
      const found = Array.from(picker()?.querySelectorAll<HTMLElement>('.asset-list-tiles__item') ?? []).at(1)
      expect(found).toBeTruthy()

      return found!
    })
    tile.click()
    await settled()
    buttonsNamed(picker()!, 'Confirm')[0].click()
    await eventually(() => expect(picker()).toBeNull())
    await eventually(() => expect([...ui.alerts()].sort()).toEqual([UPDATED, SYSTEM_ERROR].sort()))

    // The image is saved all the same: it was only its picture that could not be read.
    expect([saves(), tab()]).toEqual([
      [['/adm/v1/video/' + FIRST, { imageFile: OF_IMAGE, position: 0 }]],
      { ...WITH_SAVED, picture: 'none' },
    ])
  })
})

/* Each change of the slot in the select starts a read of the file of that slot, and the reads were answered in
 * whatever order: the card showed the file of the read answered last, under a select that said another slot, and
 * saved what was picked in it for that file. */
describe('the card of the preview image of a video, the slot changed twice while its file is read', () => {
  it('shows the file of the slot picked last when the read of the one before is answered last, and saves for it', async () => {
    const ui = await openPreview()
    const answer = holdFileReads()

    await pickSlot('extra')
    await pickSlot('default')
    await answer(1)
    expect([slotSaid(), tab()]).toEqual(['default', WITH_SAVED])
    await answer(0)

    expect([slotSaid(), tab()]).toEqual(['default', WITH_SAVED])
    buttonsNamed(detail()!, 'Unassign image')[0].click()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    expect(saves()).toEqual([['/adm/v1/video/' + FIRST, null]])
  })

  it('spins until the read of the slot picked last is answered, when the read of the one before is answered first', async () => {
    await openPreview()
    const answer = holdFileReads()

    await pickSlot('extra')
    await pickSlot('default')
    await answer(0)

    // No card yet: the file that was answered is not the one of the slot the select says.
    expect([tab().spins, tab().buttons]).toEqual([true, []])
    await answer(1)
    expect([slotSaid(), tab()]).toEqual(['default', WITH_SAVED])
  })

  // The guard: a read nobody waits for any more has nothing to say, also when it failed.
  it('says nothing of the read of the slot before when it failed, the slot picked last being shown', async () => {
    const ui = await openPreview()
    const answer = holdFileReads()

    await pickSlot('extra')
    await pickSlot('default')
    await answer(0, false)

    expect([tab().spins, tab().buttons, ui.alerts()]).toEqual([true, [], []])
    await answer(1)
    expect([slotSaid(), tab(), ui.alerts()]).toEqual(['default', WITH_SAVED, []])
  })
})

/* The dialog sets the preview image of the file the card shows, and the card read the main file of the asset after
 * it: with the select on another slot it showed the main file from then on, and saved for it. */
describe('the preview image of a video picked from a distribution, for the file of a slot that is not the main one', () => {
  /** The dialog opened from the card, its one frame picked: answers its "Confirm". */
  const pickFrame = async () => {
    buttonsNamed(detail()!, 'Choose from distribution')[0].click()
    const frame = await eventually(() => {
      const found = document.body.querySelector<HTMLElement>('.v-dialog .dam-image-grid--special .dam-image-grid__item')
      expect(found).not.toBeNull()

      return found!
    })
    frame.click()
    await settled()

    return Array.from(document.body.querySelectorAll<HTMLButtonElement>('.v-dialog button')).find(
      (button) => button.textContent?.trim() === 'Confirm' && button.closest('.v-dialog')!.contains(frame)
    )!
  }

  it('is shown by the card for that file, which the card goes on saving for', async () => {
    const ui = await openPreview()
    await pickSlot('extra')
    await eventually(() => expect(tab()).toEqual(NO_IMAGE))

    ;(await pickFrame()).click()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    await eventually(() => expect(tab()).toEqual({ ...WITH_SAVED, picture: OF_DISTRIBUTION }))

    expect(server.sent('PATCH', FROM_DISTRIBUTION).map((request) => request.url)).toEqual([
      `/adm/v1/video/${SECOND}/distribution-preview/distribution-1`,
    ])
    expect([slotSaid(), filesRead()]).toEqual(['extra', [FIRST, SECOND, SECOND]])

    buttonsNamed(detail()!, 'Unassign image')[0].click()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED, UPDATED]))
    expect([saves(), previews]).toEqual([[['/adm/v1/video/' + SECOND, null]], { [FIRST]: SAVED, [SECOND]: null }])
  })

  // The button only spins while the image is being set, and a key pressed on it is a click again.
  it('is set once, however fast the dialog is confirmed again', async () => {
    let letGo: () => void = () => undefined
    server.on(
      'PATCH',
      FROM_DISTRIBUTION,
      (_request, match) =>
        new Promise<FakeDamAnswer>((resolve) => {
          letGo = () => {
            previews[match[1]] = { imageFile: OF_DISTRIBUTION, position: 0 }
            resolve({ status: 200, data: videoFile(match[1]) })
          }
        })
    )
    const ui = await openPreview()
    const confirm = await pickFrame()

    confirm.click()
    confirm.click()
    await settled()
    letGo()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    await eventually(() => expect(tab()).toEqual({ ...WITH_SAVED, picture: OF_DISTRIBUTION }))

    expect(server.sent('PATCH', FROM_DISTRIBUTION)).toHaveLength(1)
  })
})
