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

/** When the server last changed the image of each file: a rotation changes it, and turns it on its side. */
let manipulated: Record<string, string> = {}

const imageFile = (id: string) => {
  const onItsSide = manipulated[id] === 'm2'

  return {
    ...assetFile(id, 'processed', { asset: ASSET }),
    _resourceName: 'imageFile',
    imageAttributes: {
      width: onItsSide ? 450 : 800,
      height: onItsSide ? 800 : 450,
      ratioWidth: 16,
      ratioHeight: 9,
      mostDominantColor: '#cccccc',
    },
    manipulatedAt: manipulated[id],
    mainRoute: null,
  }
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
    extSystem: { image: { slots: ['default', 'free'] } },
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
  manipulated = { 'file-1': 'm1', 'file-2': 'm1' }
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
    ],
    totalCount: 2,
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
  server.on('PATCH', ROTATE, () => {
    manipulated['file-1'] = manipulated['file-1'] === 'm1' ? 'm2' : 'm3'

    return { status: 200, data: {} }
  })
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

  it('draws a rotated image in the frame, and reads its region and its previews anew', async () => {
    const { held } = await openTab()
    const before = previews()
    const roiReads = server.sent('GET', ROI).length
    await settled()

    rotate()

    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    await settled()
    expect(server.sent('PATCH', ROTATE)).toHaveLength(1)
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

  // Read after the rotation, the file of the slot left is not drawn over the one chosen since, nor its region read.
  it('leaves the frame and the region on another slot chosen while the rotated image is read', async () => {
    const { held } = await openTab()
    const answers = hold('GET', READ_FILE_1, () => ({ status: 200, data: imageFile('file-1') }))

    rotate()
    await eventually(() => expect(answers).toHaveLength(1))
    await chooseSlot('free')
    await eventually(() => expect(previews()).toEqual([previewOf('file-2')]))
    const asked = server.requests.length
    answers[0]!()
    await settled()

    expect([framed(), previews(), held(), spinners()]).toEqual([
      detailOf('file-2') + 'm1',
      [previewOf('file-2')],
      { file: 'file-2', roi: 'roi-of-file-2', loading: false },
      0,
    ])
    expect(server.requests.length).toBe(asked)
  })

  // Two rotations one after the other: the read after the second has the image as it is now.
  it('draws the image of the later rotation when the reads after two rotations answer in the other order', async () => {
    const { held } = await openTab()
    const answers: Array<() => void> = []
    server.fileBy(
      'image',
      'file-1',
      () =>
        new Promise((resolve) => {
          const file = imageFile('file-1')
          answers.push(() => resolve(file))
        })
    )

    rotate()
    await eventually(() => expect(answers).toHaveLength(1))
    rotate()
    await eventually(() => expect(answers).toHaveLength(2))
    answers[1]!()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm3'))
    await eventually(() => expect(held().loading).toBe(false))
    const asked = server.requests.length
    answers[0]!()
    await settled()

    expect([framed(), previews(), held(), spinners()]).toEqual([
      detailOf('file-1') + 'm3',
      [previewOf('file-1')],
      { file: 'file-1', roi: 'roi-of-file-1', loading: false },
      0,
    ])
    expect(server.requests.length).toBe(asked)
  })

  // The rotation was of the file shown when it was pressed: another one shown by its answer is not read for it.
  it('reads nothing for a rotation answered after another slot was chosen', async () => {
    const { held } = await openTab()
    const rotations = hold('PATCH', ROTATE, () => ({ status: 200, data: {} }))

    rotate()
    await eventually(() => expect(rotations).toHaveLength(1))
    await chooseSlot('free')
    await eventually(() => expect(previews()).toEqual([previewOf('file-2')]))
    const asked = server.requests.length
    rotations[0]!()
    await settled()

    expect(server.requests.length).toBe(asked)
    expect(server.sent('GET', READ_FILE_2)).toHaveLength(1)
    expect([framed(), held(), spinners()]).toEqual([
      detailOf('file-2') + 'm1',
      { file: 'file-2', roi: 'roi-of-file-2', loading: false },
      0,
    ])
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
      extSystem: { image: { slots: ['default', 'free'] } },
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

  it('says so when the rotated image cannot be read, and keeps the image it has', async () => {
    const { ui, held } = await openTab()
    server.fileBy('image', 'file-1', () => {
      throw httpError(500)
    })

    rotate()

    await eventually(() => expect(ui.alerts()).toEqual([UPDATED, SYSTEM_ERROR]))
    await settled()
    expect([framed(), previews(), held(), spinners()]).toEqual([
      detailOf('file-1') + 'm1',
      [previewOf('file-1')],
      { file: 'file-1', roi: 'roi-of-file-1', loading: false },
      0,
    ])
  })

  // The rotation happened, and it says so; the tab, gone by its answer, reads nothing for it.
  it('reads nothing for a rotation answered after the tab was left', async () => {
    const { ui } = await openTab()
    const rotations = hold('PATCH', ROTATE, () => ({ status: 200, data: {} }))

    rotate()
    await eventually(() => expect(rotations).toHaveLength(1))
    document.body.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(frame()).toBeNull())
    const asked = server.requests.length
    rotations[0]!()
    await settled()

    expect(server.requests.length).toBe(asked)
    expect(ui.alerts()).toEqual([UPDATED])
  })

  /* Another slot chosen the moment the rotated image is put in the store, before the rotation goes on: the load of that
   * slot is the one that counts, and the rotation asks for no region and writes the file into no asset. */
  it('asks and writes nothing more for a rotated image read just as another slot is chosen', async () => {
    const { ui, held } = await openTab()
    const files = hold('GET', READ_FILE_1, () => ({ status: 200, data: imageFile('file-1') }))
    const regionsOfFile1 = /^\/adm\/v1\/image\/file-1\/roi$/
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

    rotate()
    await eventually(() => expect(files).toHaveLength(1))
    const option = await slotOption('free')
    const store = ui.library.useDamImageRoiStore()
    const setImageFile = store.setImageFile
    vi.spyOn(store, 'setImageFile').mockImplementation((file) => {
      setImageFile(file)
      if (file?.manipulatedAt === 'm2') option.click()
    })
    const asked = server.sent('GET', regionsOfFile1).length
    files[0]!()
    await eventually(() => expect(held()).toEqual({ file: 'file-2', roi: 'roi-of-file-2', loading: false }))
    await settled()

    expect(server.sent('GET', regionsOfFile1)).toHaveLength(asked)
    const mainFile = useAssetDetailStore().asset?.mainFile
    expect(mainFile && 'manipulatedAt' in mainFile ? mainFile.manipulatedAt : undefined).toBe('m1')
    expect([framed(), spinners()]).toEqual([detailOf('file-2') + 'm1', 0])
  })

  // Another tab opened: the tab of the region is gone, and nothing it asked for writes, asks or says anything after.
  it('does nothing more once it is left while the rotated image is read', async () => {
    const { ui } = await openTab()
    const answers = hold('GET', READ_FILE_1, () => ({ status: 200, data: imageFile('file-1') }))

    rotate()
    await eventually(() => expect(answers).toHaveLength(1))
    document.body.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await eventually(() => expect(frame()).toBeNull())
    const asked = server.requests.length
    answers[0]!()
    await settled()

    expect(server.requests.length).toBe(asked)
    expect(ui.alerts()).toEqual([UPDATED])
  })
})
