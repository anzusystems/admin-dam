import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUi } from '@/test/support/uploadUi'

/* The tab of the region of interest of an image, on the page of its asset: the panel of the tab reads the file of a
 * slot and its region, and the frame of the library beside it draws them - the frame is drawn first, as the tab opens,
 * and both take one store, the library's. The previews are reloaded, the image is rotated and another slot is chosen
 * there. The real page with the application around it as it starts, in English; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

// The page reads only an asset by a UUID.
const ASSET = '11111111-2222-4333-8444-555555555555'
const ROI = /^\/adm\/v1\/roi\/(roi-of-[^/]+)$/
const ROI_LIST = /^\/adm\/v1\/image\/(file-\d)\/roi$/
const READ_FILE_1 = /^\/adm\/v1\/image\/file-1$/
const READ_FILE_2 = /^\/adm\/v1\/image\/file-2$/
const ROTATE = /^\/adm\/v1\/image\/file-1\/rotate\/(90|270)$/
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'

/** How many times the server turned each file by 90°, and when it last changed its image: a rotation changes it.
 * `sameSecond`: rotations of one second, which the server marks with the same time. */
let rotations: Record<string, number> = {}
let manipulated: Record<string, string> = {}
let sameSecond = false

const imageFile = (id: string) => {
  const rotation = ((rotations[id] ?? 0) * 90) % 360
  const onItsSide = rotation % 180 !== 0

  return {
    ...assetFile(id, 'processed', { asset: ASSET }),
    _resourceName: 'imageFile',
    imageAttributes: {
      width: onItsSide ? 450 : 800,
      height: onItsSide ? 800 : 450,
      ratioWidth: 16,
      ratioHeight: 9,
      rotation,
      mostDominantColor: '#cccccc',
    },
    manipulatedAt: manipulated[id],
    mainRoute: null,
  }
}

/** The main file turned by the server, which answers with the file turned. */
const rotateOnServer = (): FakeDamAnswer => {
  rotations['file-1'] = (rotations['file-1'] ?? 0) + 1
  manipulated['file-1'] = sameSecond ? 'm2' : 'm' + (rotations['file-1'] + 1)

  return { status: 200, data: imageFile('file-1') }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

type Frame = Element & {
  __vueParentComponent?: { props: { src?: string }; emit: (event: string, ...args: unknown[]) => void }
}
/** The frame of the region, the library's `ACropper`: what it builds of the image in the page happy-dom does not draw,
 * so it is read and moved by its component. */
const frame = () => document.body.querySelector<Frame>('.dam-image-detail__left .a-cropper')

/** The image the frame is given to draw, by its address, or nothing while there is no frame. */
const framed = () => frame()?.__vueParentComponent?.props.src ?? null

/** The region dragged in the frame to the place and size it gives as parts of the image, as the frame commits it. */
const drag = (crop: { x: number; y: number; width: number; height: number }) =>
  frame()!.__vueParentComponent!.emit('commit', crop)

/** The previews of the region, by their addresses. */
const previews = () =>
  Array.from(document.body.querySelectorAll<HTMLImageElement>('.crop-preview img'), (image) =>
    image.getAttribute('src')
  )

/** How many spinners the detail shows: the panel's and the frame's, as long as either loads. */
const spinners = () => document.body.querySelectorAll('.dam-image-detail .v-progress-circular').length

const detailOf = (file: string) => `https://dam.test/${file}/detail.jpg?manipulated=`
const previewOf = (file: string) =>
  expect.stringMatching(new RegExp(`^https://dam\\.test/roi-of-${file}/preview\\.jpg\\?timestamp=\\d+$`))

/** The tab of the region opened, in the sidebar of the detail. */
const openFocus = async () => {
  const tab = await eventually(() => {
    const found = document.body.querySelector<HTMLElement>('[data-cy="button-focus"]')
    expect(found).toBeTruthy()

    return found!
  })
  tab.click()
}

/** The page of the asset, its tab of the region open, the frame drawing the main file. */
const openTab = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_regionOfInterest_update'],
    extSystem: { image: { slots: ['default', 'free', 'empty'] } },
  })
  const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push('/assets/' + ASSET)
  await ui.mount(async () => ({ default: RouterView }))
  await openFocus()
  await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm1'))
  await eventually(() => expect(previews()).toHaveLength(1))

  return { ui, held: () => heldBy(ui) }
}

/** What the store of the frame holds: the file, its region, and whether it loads. */
const heldBy = (ui: UploadUi) => {
  const store = ui.library.useDamImageRoiStore()

  return { file: store.imageFile?.id ?? null, roi: store.roi?.id ?? null, loading: store.loader }
}

/** The select of the slot of the tab opened: answers the option of the slot. */
const slotOption = async (name: string) => {
  document.body
    .querySelector('.dam-image-detail__sidebar .v-select .v-field')!
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

  return eventually(() => {
    const found = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
      (item) => item.textContent?.trim() === name
    )
    expect(found).toBeTruthy()

    return found!
  })
}

/** The slot chosen in the select of the tab. */
const chooseSlot = async (name: string) => (await slotOption(name)).click()

const rotate = () => document.body.querySelector<HTMLButtonElement>('[data-cy="button-rotate-right"]')!.click()

/** How far the image the frame was given, and the main file of the asset the detail holds, are turned. */
const turnedBy = (ui: UploadUi, detail: { asset: { mainFile: unknown } | null }) => ({
  frame: ui.library.useDamImageRoiStore().imageFile?.imageAttributes.rotation ?? null,
  asset:
    (detail.asset?.mainFile as { imageAttributes?: { rotation?: number } } | null)?.imageAttributes?.rotation ?? null,
})

/** The buttons that turn the image, there or not. */
const rotateButtons = () => document.body.querySelectorAll('[data-cy="button-rotate-right"]').length

/** The tab left for "Info" and opened again: it draws the main file of the asset the detail holds. */
const openAgain = async () => {
  document.body.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
  await eventually(() => expect(frame()).toBeNull())
  await openFocus()
}

const NO_IMAGE = 'The slot has no image.'
/** What the tab says of the slot chosen, other than its previews. */
const saysNoImage = () => !!document.body.querySelector('.dam-image-detail__sidebar')?.textContent?.includes(NO_IMAGE)

/** Answers of the server to the reads the pattern matches, held from now on until released one by one. */
const hold = (method: 'GET' | 'PATCH', pattern: RegExp, answer: (match: RegExpMatchArray) => FakeDamAnswer) => {
  const held: Array<() => void> = []
  server.on(
    method,
    pattern,
    (_request, match) => new Promise<FakeDamAnswer>((resolve) => held.push(() => resolve(answer(match))))
  )

  return held
}

const regionsOf = (file: string): FakeDamAnswer => ({ status: 200, data: { data: [{ id: 'roi-of-' + file }] } })

beforeEach(() => {
  server = createFakeDam()
  rotations = {}
  manipulated = { 'file-1': 'm1', 'file-2': 'm1' }
  sameSecond = false
  server.asset({
    ...assetDetail(ASSET, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      licence: 1,
      mainFile: imageFile('file-1'),
    }),
    keywords: [],
    authors: [],
  })
  server.slotsBy(ASSET, () => ({
    data: [
      { id: 'slot-default', slotName: 'default', default: true, main: true, assetFile: imageFile('file-1') },
      { id: 'slot-free', slotName: 'free', default: false, main: false, assetFile: imageFile('file-2') },
      { id: 'slot-empty', slotName: 'empty', default: false, main: false, assetFile: null },
    ],
    totalCount: 3,
  }))
  server.fileBy('image', 'file-1', () => imageFile('file-1'))
  server.fileBy('image', 'file-2', () => imageFile('file-2'))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The one region of each file, with its one preview.
  server.on('GET', ROI_LIST, (_request, match) => regionsOf(match[1]))
  server.on('GET', ROI, (_request, match) => ({
    status: 200,
    data: {
      id: match[1],
      image: match[1].replace('roi-of-', ''),
      pointX: 0,
      pointY: 0,
      percentageWidth: 1,
      percentageHeight: 1,
      links: {
        image_roi_example: [{ url: `https://dam.test/${match[1]}/preview.jpg`, title: '16:9', width: 160, height: 90 }],
      },
    },
  }))
  server.on('PUT', ROI, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', ROTATE, rotateOnServer)
})

afterEach(() => {
  stopUploadUi()
})

describe('the tab of the region of interest of an image', () => {
  it('draws in the frame the image of the main file, and the previews of its region', async () => {
    const { held } = await openTab()

    expect(framed()).toBe(detailOf('file-1') + 'm1')
    expect(previews()).toEqual([previewOf('file-1')])
    expect([held(), spinners()]).toEqual([{ file: 'file-1', roi: 'roi-of-file-1', loading: false }, 0])
  })

  it('reloads its previews, the frame left as it is', async () => {
    await openTab()
    const before = previews()
    await settled()

    buttonsNamed(document.body, 'Refresh previews')[0]!.click()
    await settled()

    expect(previews()).toEqual([previewOf('file-1')])
    expect(previews()).not.toEqual(before)
    expect(framed()).toBe(detailOf('file-1') + 'm1')
  })

  // The server answers the rotation with the file turned: that is drawn, and its region and its previews read anew.
  it('draws a rotated image in the frame, and reads its region and its previews anew', async () => {
    const { held } = await openTab()
    const before = previews()
    const roiReads = server.sent('GET', ROI).length
    await settled()

    rotate()

    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    await settled()
    expect(server.sent('PATCH', ROTATE)).toHaveLength(1)
    expect(server.sent('GET', READ_FILE_1)).toHaveLength(0)
    expect(server.sent('GET', ROI)).toHaveLength(roiReads + 1)
    expect(previews()).toEqual([previewOf('file-1')])
    expect(previews()).not.toEqual(before)
    expect([held(), spinners()]).toEqual([{ file: 'file-1', roi: 'roi-of-file-1', loading: false }, 0])
  })

  // The tab draws the main file of the asset the detail holds: that is the rotated one now, as the server has it.
  it('draws the rotated image again when the tab is opened again, and a region dragged there is saved by it', async () => {
    await openTab()
    rotate()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    await settled()

    document.body.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(frame()).toBeNull())
    await openFocus()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    await eventually(() => expect(previews()).toHaveLength(1))
    drag({ x: 0.5, y: 0.25, width: 0.5, height: 0.5 })
    await eventually(() => expect(server.sent('PUT', ROI)).toHaveLength(1))

    // On its side the image is 450 wide and 800 high.
    expect(JSON.parse(server.sent('PUT', ROI)[0]!.data as string)).toMatchObject({ pointX: 225, pointY: 200 })
  })

  it('draws the image of another slot in the frame, with the previews of its region', async () => {
    const { held } = await openTab()

    await chooseSlot('free')

    await eventually(() => expect(framed()).toBe(detailOf('file-2') + 'm1'))
    await eventually(() => expect(previews()).toEqual([previewOf('file-2')]))
    expect([held(), spinners()]).toEqual([{ file: 'file-2', roi: 'roi-of-file-2', loading: false }, 0])
  })

  // The rotation is drawn only for the file the tab shows, or is about to show, when it is answered.
  it('leaves a slot chosen while the rotation runs to load, and draws it', async () => {
    const { held } = await openTab()
    const rotationsHeld = hold('PATCH', ROTATE, rotateOnServer)
    const files = hold('GET', READ_FILE_2, () => ({ status: 200, data: imageFile('file-2') }))
    const regionsOfFile1 = server.sent('GET', /^\/adm\/v1\/image\/file-1\/roi$/).length

    rotate()
    await eventually(() => expect(rotationsHeld).toHaveLength(1))
    await chooseSlot('free')
    await eventually(() => expect(files).toHaveLength(1))
    rotationsHeld[0]!()
    await settled()
    files[0]!()
    await settled()

    expect([framed(), previews(), held(), spinners()]).toEqual([
      detailOf('file-2') + 'm1',
      [previewOf('file-2')],
      { file: 'file-2', roi: 'roi-of-file-2', loading: false },
      0,
    ])
    expect(server.sent('GET', /^\/adm\/v1\/image\/file-1\/roi$/)).toHaveLength(regionsOfFile1)
  })

  /* The tab opened again while the rotation runs draws the main file from before it; once the rotation is answered, it
   * draws the turned one and reads its region. The file turns once at a time: the tab opened again offers no rotation
   * of it meanwhile. */
  it('draws the turned image in a tab opened again while the rotation runs, and offers no second rotation meanwhile', async () => {
    const { ui } = await openTab()
    const rotationsHeld = hold('PATCH', ROTATE, rotateOnServer)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

    rotate()
    await eventually(() => expect(rotationsHeld).toHaveLength(1))
    await openAgain()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm1'))
    expect(rotateButtons()).toBe(0)
    const roiReads = server.sent('GET', ROI).length
    rotationsHeld[0]!()

    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    await settled()
    expect(server.sent('GET', ROI)).toHaveLength(roiReads + 1)
    expect(server.sent('PATCH', ROTATE)).toHaveLength(1)
    expect([turnedBy(ui, useAssetDetailStore()), rotateButtons(), ui.alerts()]).toEqual([
      { frame: 90, asset: 90 },
      1,
      [UPDATED],
    ])
  })

  /* The rotation was of the file shown when it was pressed: another one shown by its answer is left as it is. The main
   * file the server answered with is the asset's all the same, and the tab draws it when opened again. */
  it('draws nothing for a rotation answered after another slot was chosen, and the turned image on the next visit', async () => {
    const { held } = await openTab()
    const rotationsHeld = hold('PATCH', ROTATE, rotateOnServer)

    rotate()
    await eventually(() => expect(rotationsHeld).toHaveLength(1))
    await chooseSlot('free')
    await eventually(() => expect(previews()).toEqual([previewOf('file-2')]))
    const asked = server.requests.length
    rotationsHeld[0]!()
    await settled()

    expect(server.requests.length).toBe(asked)
    expect([framed(), held(), spinners()]).toEqual([
      detailOf('file-2') + 'm1',
      { file: 'file-2', roi: 'roi-of-file-2', loading: false },
      0,
    ])
    await openAgain()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
  })

  /* Two rotations within one second, which the server marks with the same time: the second, pressed once the first is
   * answered, is the file the server answers last, and the one the asset keeps and the tab draws, also on the next
   * visit. Nothing is read for either: the answer of the rotation is the file turned. */
  it('keeps the later of two rotations within one second, also on the next visit', async () => {
    const { ui } = await openTab()
    sameSecond = true
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

    rotate()
    await settled()
    await eventually(() => expect([server.sent('PATCH', ROTATE).length, rotateButtons()]).toEqual([1, 1]))
    rotate()
    await settled()
    await eventually(() => expect([server.sent('PATCH', ROTATE).length, rotateButtons()]).toEqual([2, 1]))
    await settled()

    expect([turnedBy(ui, useAssetDetailStore()), framed(), server.sent('GET', READ_FILE_1)]).toEqual([
      { frame: 180, asset: 180 },
      detailOf('file-1') + 'm2',
      [],
    ])
    await openAgain()
    await eventually(() => expect(turnedBy(ui, useAssetDetailStore())).toEqual({ frame: 180, asset: 180 }))
  })

  // A slot without a file has no image to draw, nor a region to drag: the frame is empty, and the tab says why.
  it('draws no image for a slot without one and says so, and draws the image of a slot with one again', async () => {
    const { held } = await openTab()

    await chooseSlot('empty')
    await eventually(() => expect(framed()).toBeNull())

    expect([held(), spinners(), saysNoImage(), previews()]).toEqual([
      { file: null, roi: null, loading: false },
      0,
      true,
      [],
    ])
    expect(document.body.querySelector('[data-cy="button-rotate-right"]')).toBeNull()
    await chooseSlot('free')
    await eventually(() => expect(framed()).toBe(detailOf('file-2') + 'm1'))
    await eventually(() => expect(previews()).toEqual([previewOf('file-2')]))
    expect([held(), saysNoImage()]).toEqual([{ file: 'file-2', roi: 'roi-of-file-2', loading: false }, false])
  })

  // Scenario of a slow file: chosen first and answered last, it is not drawn over the slot chosen after it.
  it('stays on the slot chosen last when the file of the one chosen before answers after it', async () => {
    const { held } = await openTab()
    const files = hold('GET', READ_FILE_2, () => ({ status: 200, data: imageFile('file-2') }))

    await chooseSlot('free')
    await eventually(() => expect(files).toHaveLength(1))
    await chooseSlot('default')
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm1'))
    await eventually(() => expect(held().loading).toBe(false))
    files[0]!()
    await settled()

    expect([framed(), previews(), held(), spinners()]).toEqual([
      detailOf('file-1') + 'm1',
      [previewOf('file-1')],
      { file: 'file-1', roi: 'roi-of-file-1', loading: false },
      0,
    ])
  })

  // Scenario of slow regions: a region of one file over the image of another would be saved by the wrong dimensions.
  it('stays on the region of the slot chosen last when the regions of the one chosen before answer after it', async () => {
    const { held } = await openTab()
    const lists = hold('GET', /^\/adm\/v1\/image\/(file-2)\/roi$/, (match) => regionsOf(match[1]!))

    await chooseSlot('free')
    await eventually(() => expect(lists).toHaveLength(1))
    await chooseSlot('default')
    await eventually(() => expect(held()).toEqual({ file: 'file-1', roi: 'roi-of-file-1', loading: false }))
    lists[0]!()
    await settled()

    expect([framed(), previews(), held(), spinners()]).toEqual([
      detailOf('file-1') + 'm1',
      [previewOf('file-1')],
      { file: 'file-1', roi: 'roi-of-file-1', loading: false },
      0,
    ])
    expect(server.sent('GET', /^\/adm\/v1\/roi\/roi-of-file-2$/)).toHaveLength(0)
  })

  it('says so when its regions cannot be read, and stops its spinners', async () => {
    server.on('GET', ROI_LIST, () => {
      throw httpError(500)
    })
    const ui = await startUploadUi({
      server,
      grants: ['dam_asset_update', 'dam_image_update', 'dam_regionOfInterest_update'],
      extSystem: { image: { slots: ['default', 'free', 'empty'] } },
    })
    const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
    ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
    await ui.router.push('/assets/' + ASSET)
    await ui.mount(async () => ({ default: RouterView }))
    await openFocus()

    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    await settled()
    expect([framed(), spinners(), heldBy(ui).loading]).toEqual([detailOf('file-1') + 'm1', 0, false])
    expect(buttonsNamed(document.body, 'Refresh previews')).toHaveLength(1)
  })

  // The server answers the rotation with the file turned: nothing more is read for it, so nothing more can fail.
  it('draws the turned image whether or not the file could be read again', async () => {
    const { ui } = await openTab()
    server.fileBy('image', 'file-1', () => {
      throw httpError(500)
    })
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

    rotate()

    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    await settled()
    expect([ui.alerts(), turnedBy(ui, useAssetDetailStore()), spinners()]).toEqual([
      [UPDATED],
      { frame: 90, asset: 90 },
      0,
    ])
  })

  /* The rotation happened, and it says so. The tab, gone by its answer, asks nothing for it; the main file the server
   * answered with is the asset's, and the tab draws it when opened again. */
  it('asks nothing for a rotation answered after the tab was left, and draws it on the next visit', async () => {
    const { ui } = await openTab()
    const rotationsHeld = hold('PATCH', ROTATE, rotateOnServer)

    rotate()
    await eventually(() => expect(rotationsHeld).toHaveLength(1))
    document.body.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(frame()).toBeNull())
    const asked = server.requests.length
    rotationsHeld[0]!()
    await settled()

    expect(server.requests.length).toBe(asked)
    expect(ui.alerts()).toEqual([UPDATED])
    await openFocus()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
  })
})
