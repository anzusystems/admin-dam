import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The add-distribution dialog has a tab per service, each with a select of
 * the slot whose file it distributes. A redistribution dialog has no select.
 * The file and its status are kept between tabs and between dialog openings. Bugs this guards:
 * a redrawn tab showed the main slot while the file of the previously picked slot was distributed;
 * a picked slot with an unprocessed file made every later dialog say the
 * file must be processed, also for other assets and redistributions.
 * Uses the real tab and dialogs; the server is a fake.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SERVICES = { jw_a: 'JW A', jw_b: 'JW B' }
const FILE_LIST = /^\/adm\/v1\/distribution\/asset-file\/([^/]+)$/
const DISTRIBUTE = /^\/adm\/v1\/jw-distribution\/asset-file\/([^/]+)\/distribute$/
const REDISTRIBUTE = /^\/adm\/v1\/jw-distribution\/([^/]+)\/redistribute$/

const MUST_BE_PROCESSED = 'Asset file must be processed before distribution'
const CREATED = 'Record was created'
const UPDATED = 'Record was updated'

const slot = (slotName: string, fileId: string, status: 'processed' | 'uploading' = 'processed', main = false) => ({
  id: 'slot-' + slotName,
  slotName,
  default: main,
  main,
  assetFile: assetFile(fileId, status, { asset: 'asset-1' }),
})

const distribution = (id: string, distributionService: string) => ({
  id,
  assetId: 'asset-1',
  assetFileId: 'file-1',
  extId: 'remote-' + id,
  distributionService,
  status: 'distributed',
  failReason: 'none',
  texts: { title: 'Title', description: 'Description', author: 'Author', keywords: [] },
  blockedBy: [],
  publishAt: null,
  _resourceName: 'jwDistribution',
})

let listed: ReturnType<typeof distribution>[] = []

const dialog = () => document.body.querySelector<HTMLElement>('.dialog-distribution.v-overlay--active')
const slotSelect = () => dialog()!.querySelector<HTMLElement>('.v-select')!
const shownSlot = () => slotSelect().querySelector('.v-select__selection-text')?.textContent?.trim()
const tabDrawn = () =>
  dialogButton('Add') !== null ||
  buttonsNamed(dialog()!, 'Redistribute').length > 0 ||
  !!dialog()!.textContent?.includes(MUST_BE_PROCESSED)
const distributed = () => server.sent('POST', DISTRIBUTE).map((request) => request.url.match(DISTRIBUTE)![1])

const openTab = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_distribution_access', 'dam_distribution_create', 'dam_distribution_update'],
    extSystem: {
      video: {
        distribution: {
          distributionServices: Object.keys(SERVICES),
          distributionRequirements: Object.fromEntries(
            Object.entries(SERVICES).map(([name, title]) => [name, { title, requiredAuth: false, blockedBy: [] }])
          ),
        },
      } as never,
    },
  })
  const config = ui.library.useDamConfigStore()
  config.damPrvConfig = {
    ...config.damPrvConfig,
    distributionServices: Object.fromEntries(
      Object.entries(SERVICES).map(([name, title]) => [
        name,
        {
          title,
          iconPath: '',
          type: ui.library.DamDistributionServiceType.Jw,
          allowedRedistributeStatuses: ['distributed'],
        },
      ])
    ),
  }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({ ...currentUser.value, allowedDistributionServices: Object.keys(SERVICES) } as never)
  const asset = {
    ...assetDetail('asset-1', { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
    keywords: [],
    authors: [],
  }
  server.asset(asset)
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  useAssetDetailStore().setAsset(asset as never)

  await ui.mount(
    () => import('@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsTeleportTarget.vue')
  )
  const tab = await ui.mount(
    () =>
      import('@/domains/coreDam/asset/components/detail/components/distribution/AssetDetailSidebarDistribution.vue'),
    { isActive: true, assetType: 'video', assetId: 'asset-1', assetMainFileStatus: 'processed' }
  )
  await eventually(() => expect(tab.textContent).toContain(listed.length ? 'Redistribute' : 'Nothing to show'))

  const toService = async (title: string) => {
    buttonsNamed(dialog()!, title)[0].click()
    await eventually(() => expect(tabDrawn()).toBe(true))
  }

  return {
    ...ui,
    tab,
    toService,
    addNew: async (title = SERVICES.jw_a) => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="add-new-distribution"]')!.click()
      await eventually(() => expect(dialog()).not.toBeNull())
      await toService(title)
    },
    redistribute: async () => {
      buttonsNamed(tab, 'Redistribute')[0].click()
      await eventually(() =>
        expect(dialogButton('Confirm') !== null || !!dialog()?.textContent?.includes(MUST_BE_PROCESSED)).toBe(true)
      )
    },
    pickSlot: async (slotName: string) => {
      await eventually(() => expect(shownSlot()).toBeTruthy())
      slotSelect()
        .querySelector('.v-field')!
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      const option = await eventually(() => {
        const found = Array.from(
          document.body.querySelectorAll<HTMLElement>('.v-menu.v-overlay--active .v-list-item')
        ).find((item) => item.textContent?.trim() === slotName)
        expect(found).toBeTruthy()

        return found!
      })
      option.click()
      await eventually(() => expect(shownSlot()).toBe(slotName))
      await vi.advanceTimersByTimeAsync(100)
    },
    close: async () => {
      dialog()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
      await eventually(() => expect(dialog()).toBeNull())
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  listed = []
  server.slotsBy('asset-1', () => ({
    data: [slot('default', 'file-1', 'processed', true), slot('extra', 'file-2'), slot('raw', 'file-3', 'uploading')],
    totalCount: 3,
  }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset\/asset-1$/, () => ({
    status: 200,
    data: { data: structuredClone(listed) },
  }))
  server.on('GET', FILE_LIST, () => ({ status: 200, data: { data: [] } }))
  server.on('GET', /^\/adm\/v1\/jw-distribution\/asset-file\/[^/]+\/prepare-payload\/[^/]+$/, () => ({
    status: 200,
    data: { texts: { title: 'Title', description: 'Description', author: 'Author', keywords: [] }, blockedBy: [] },
  }))
  server.on('POST', DISTRIBUTE, (request) => ({ status: 201, data: JSON.parse(request.data as string) }))
  server.on('PUT', REDISTRIBUTE, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the dialog that adds a distribution', () => {
  it('opens on the main slot and distributes its file', async () => {
    const ui = await openTab()
    await ui.addNew()

    dialogButton('Add')!.click()

    await eventually(() => expect(ui.alerts()).toEqual([CREATED]))
    expect([shownSlot(), distributed()]).toEqual(['default', ['file-1']])
  })

  it('distributes the file of the slot its select shows after another service is picked', async () => {
    const ui = await openTab()
    await ui.addNew()
    await ui.pickSlot('extra')

    await ui.toService(SERVICES.jw_b)
    await eventually(() => expect(shownSlot()).toBe('extra'))
    dialogButton('Add')!.click()

    await eventually(() => expect(ui.alerts()).toEqual([CREATED]))
    expect(distributed()).toEqual(['file-2'])
  })

  it('opens on the main file again after a slot whose file is not processed was picked and the dialog closed', async () => {
    const ui = await openTab()
    await ui.addNew()
    await ui.pickSlot('raw')
    expect(dialog()!.textContent).toContain(MUST_BE_PROCESSED)
    await ui.close()

    await ui.addNew()

    expect(dialog()!.textContent).not.toContain(MUST_BE_PROCESSED)
    await eventually(() => expect(shownSlot()).toBe('default'))
    dialogButton('Add')!.click()
    await eventually(() => expect(ui.alerts()).toEqual([CREATED]))
    expect(distributed()).toEqual(['file-1'])
  })
})

describe('the dialog of a redistribution', () => {
  it('opens its form after a slot whose file is not processed was picked in the dialog that adds one', async () => {
    listed = [distribution('dist-1', 'jw_a')]
    server.on('GET', FILE_LIST, () => ({ status: 200, data: { data: structuredClone(listed) } }))
    const ui = await openTab()
    await ui.addNew()
    await ui.pickSlot('raw')
    await ui.close()

    await ui.redistribute()

    expect(dialog()!.textContent).not.toContain(MUST_BE_PROCESSED)
    dialogButton('Confirm')!.click()
    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    expect(server.sent('PUT', REDISTRIBUTE).map((request) => request.url)).toEqual([
      '/adm/v1/jw-distribution/dist-1/redistribute',
    ])
  })
})
