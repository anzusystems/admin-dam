import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The card of the preview image of a video, in the Image preview tab of the detail of its asset. It shows the image
 * of the file of one slot of the asset, and a select above it changes the slot. An image is taken away by a button
 * of the card and picked in the dialog of the library, and each change is saved at once, one save after the other:
 * the card can be changed again, and switched to another slot, while a save is on its way. The real page of the list
 * with its real detail, the application around it as it starts; the server is a fake, and so is the address the page
 * asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const PREVIEW = /^\/adm\/v1\/video\/([^/]+)$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const LIST = '/assets'
const VIDEO = 'asset-1'
const IMAGE = 'asset-2'
/** The files of the two slots of the video, "default" and "extra", and the file of the image. */
const FIRST = 'video-1'
const SECOND = 'video-2'
const OF_IMAGE = 'file-3'

type Preview = { imageFile: string; position: number } | null
const SAVED: Preview = { imageFile: 'image-saved', position: 0 }
const PICKED: Preview = { imageFile: OF_IMAGE, position: 0 }

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

/** The card: whether it has an image to take away, and whose picture it draws - told by the address of the picture. */
const card = () => {
  const src = tabOfPreview().querySelector('.v-img__img')?.getAttribute('src') ?? ''

  return {
    image: buttonsNamed(detail()!, 'Unassign image').length === 1,
    picture: src.includes(SAVED!.imageFile) ? 'saved' : src.includes(OF_IMAGE) ? 'picked' : 'none',
  }
}

/** What the server was asked to save as a preview image, save by save: for which file, and which image. */
const saves = () =>
  server.sent('PUT', PREVIEW).map((request) => [request.url, JSON.parse(request.data as string).imagePreview])

/* Every save of a preview image is held from now on. Answered in the order they were sent: it went through, and the
 * server holds the image, or it failed. */
const holdSaves = () => {
  const answers: Array<(went: boolean) => void> = []
  server.on(
    'PUT',
    PREVIEW,
    (request, match) =>
      new Promise<FakeDamAnswer>((resolve, reject) => {
        answers.push((went) => {
          if (!went) return reject(httpError(500))
          previews[match[1]] = JSON.parse(request.data as string).imagePreview
          resolve({ status: 200, data: videoFile(match[1]) })
        })
      })
  )

  return async (went: boolean) => {
    answers.shift()!(went)
    await settled()
  }
}

/** The tab of the preview image of the video, the card of the file of its main slot drawn. */
const openPreview = async () => {
  // A picture is drawn with its address as soon as it would come into view.
  vi.stubGlobal('IntersectionObserver', InView)
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_video_update'],
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
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
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
  await eventually(() => expect(buttonsNamed(detail()!, 'Select image')).toHaveLength(1))

  return ui
}

const takeAway = async () => {
  buttonsNamed(detail()!, 'Unassign image')[0].click()
  await settled()
}

/** The dialog of the library opened from the card, its tiles drawn: the second is the image. */
const openPicker = async () => {
  buttonsNamed(detail()!, 'Select image')[0].click()

  return eventually(() => {
    const found = Array.from(picker()?.querySelectorAll<HTMLElement>('.asset-list-tiles__item') ?? []).at(1)
    expect(found).toBeTruthy()

    return found!
  })
}

/** The file of the image picked in the dialog of the library, and the dialog confirmed. */
const pickImage = async () => {
  ;(await openPicker()).click()
  await settled()
  buttonsNamed(picker()!, 'Confirm')[0].click()
  await eventually(() => expect(picker()).toBeNull())
  await settled()
}

/** The card switched to the file of the slot, by the select above it. */
const showSlot = async (name: string) => {
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
  await eventually(() => expect(buttonsNamed(detail()!, 'Select image')).toHaveLength(1))
}

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
  for (const fileId of [SAVED!.imageFile, OF_IMAGE]) server.fileBy('image', fileId, () => imageFile(fileId))
  server.on('PUT', PREVIEW, (request, match) => {
    previews[match[1]] = JSON.parse(request.data as string).imagePreview

    return { status: 200, data: videoFile(match[1]) }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the preview image of a video, saved while the card is changed again or shows another file', () => {
  /* A save that waited for its turn read the file and the image off the card as its turn came: with the card
   * switched to another slot meanwhile, it saved the image of that other file over itself, and what was picked for
   * the first was not saved at all. */
  it('saves an image for the file it was picked for, once the card shows the file of another slot', async () => {
    const answer = holdSaves()
    const ui = await openPreview()

    await takeAway()
    await pickImage()
    await showSlot('extra')
    expect([saves(), card()]).toEqual([[['/adm/v1/video/' + FIRST, null]], { image: false, picture: 'none' }])
    await answer(true)
    await eventually(() => expect(saves()).toHaveLength(2))

    expect(saves()[1]).toEqual(['/adm/v1/video/' + FIRST, PICKED])
    await answer(true)
    expect([previews, card(), ui.alerts()]).toEqual([
      { [FIRST]: PICKED, [SECOND]: null },
      { image: false, picture: 'none' },
      [UPDATED, UPDATED],
    ])
  })

  /* The card went back to the saved image by being drawn anew, and the dialog of the library, a part of the card,
   * was closed with it under the hand of the user. */
  it('goes back to the saved image after a save that failed, with the dialog of the library left open', async () => {
    const answer = holdSaves()
    const ui = await openPreview()
    expect(card()).toEqual({ image: true, picture: 'saved' })

    await takeAway()
    expect(card()).toEqual({ image: false, picture: 'none' })
    await openPicker()
    await answer(false)
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([picker() === null, card().image]).toEqual([false, true])
    picker()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
    await eventually(() => expect(picker()).toBeNull())
    await eventually(() => expect(card()).toEqual({ image: true, picture: 'saved' }))
    expect(saves()).toEqual([['/adm/v1/video/' + FIRST, null]])
  })

  /* Put back after a save of "none" that failed, the image is the one the card has read last. It read its picture
   * again all the same, and with the server away - what the save failed of - that read never ended: the card spun
   * for good. */
  it('goes back to the saved image with no read of its picture, the server being away', async () => {
    const answer = holdSaves()
    const ui = await openPreview()
    expect(card()).toEqual({ image: true, picture: 'saved' })
    const pictureReads = () =>
      server.sent('GET').filter((request) => request.url.endsWith('/' + SAVED!.imageFile)).length
    const readBefore = pictureReads()
    server.fileBy('image', SAVED!.imageFile, () => new Promise(() => undefined))

    await takeAway()
    await answer(false)
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([card(), pictureReads() - readBefore]).toEqual([{ image: true, picture: 'saved' }, 0])
  })

  /* The save that failed told "changed since" by the image the card held: taken away, picked and taken away again,
   * the card held what the failed save had sent, and the saved image was put over the third change. */
  it('keeps a third change that is the same as the first, whose save failed, and saves all three', async () => {
    const answer = holdSaves()
    const ui = await openPreview()

    await takeAway()
    await pickImage()
    await eventually(() => expect(card()).toEqual({ image: true, picture: 'picked' }))
    await takeAway()
    await answer(false)
    await eventually(() => expect(saves()).toHaveLength(2))
    expect([ui.alerts(), card()]).toEqual([[SYSTEM_ERROR], { image: false, picture: 'none' }])
    await answer(true)
    await eventually(() => expect(saves()).toHaveLength(3))
    await answer(true)

    expect(saves().map(([, image]) => image)).toEqual([null, PICKED, null])
    expect([previews[FIRST], card(), ui.alerts()]).toEqual([
      null,
      { image: false, picture: 'none' },
      [SYSTEM_ERROR, UPDATED, UPDATED],
    ])
  })

  /* What is saved is told for the file the card shows when a save is answered, by its id: switched to another slot
   * and back, the card holds the file read anew. The image saved meanwhile is the one it goes back to. */
  it('goes back to what a save answered since has saved for the file, read anew meanwhile', async () => {
    const answer = holdSaves()
    const ui = await openPreview()

    await takeAway()
    await showSlot('extra')
    await showSlot('default')
    // Read before the save was answered: the image is still there.
    expect(card().image).toBe(true)
    await answer(true)
    expect([previews[FIRST], ui.alerts()]).toEqual([null, [UPDATED]])
    await pickImage()
    await answer(false)
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED, SYSTEM_ERROR]))

    expect(card()).toEqual({ image: false, picture: 'none' })
  })

  // The guard: a save answered for the file of another slot says nothing of the file the card shows.
  it('does not take the image saved for the file of another slot for the saved one of the file it shows', async () => {
    const answer = holdSaves()
    const ui = await openPreview()

    await pickImage()
    await showSlot('extra')
    await answer(true)
    expect([previews, ui.alerts()]).toEqual([{ [FIRST]: PICKED, [SECOND]: null }, [UPDATED]])
    await pickImage()
    await eventually(() => expect(card()).toEqual({ image: true, picture: 'picked' }))
    await answer(false)
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED, SYSTEM_ERROR]))

    expect([saves().map(([url]) => url), card()]).toEqual([
      ['/adm/v1/video/' + FIRST, '/adm/v1/video/' + SECOND],
      { image: false, picture: 'none' },
    ])
  })

  /* The guard, of what took the place of the card drawn anew: the picture of an image is read as the image is
   * picked, and the answer can come after the card went back to the saved one. */
  it('does not draw the picture of a picked image that comes after the card went back to the saved one', async () => {
    const answer = holdSaves()
    let showPicked: () => void = () => undefined
    server.fileBy('image', OF_IMAGE, () => new Promise((resolve) => (showPicked = () => resolve(imageFile(OF_IMAGE)))))
    const ui = await openPreview()

    await pickImage()
    await answer(false)
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    await eventually(() => expect(card()).toEqual({ image: true, picture: 'saved' }))
    showPicked()
    await settled()

    expect(card()).toEqual({ image: true, picture: 'saved' })
  })

  /* The guard: the tab draws the card anew, behind its own loader, each time the slot is changed, so the card of a
   * file with no preview image never showed the picture of the file before. */
  it('shows no picture for the file of a slot that has no preview image', async () => {
    await openPreview()
    expect(card()).toEqual({ image: true, picture: 'saved' })

    await showSlot('extra')

    expect(card()).toEqual({ image: false, picture: 'none' })
  })
})
