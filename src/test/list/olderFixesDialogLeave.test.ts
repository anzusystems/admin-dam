import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The dialog that changes the licence and the one of "Create empty asset", in the menu of the page: while their
 * request is on its way they cannot be closed - what holds a second confirm back goes with the dialog. A way out of
 * the page took them away all the same: the back button of the browser onto an entry where ADAM was loaded or
 * reloaded gets past Vuetify, which otherwise only closes a dialog. The real menu with its real dialogs on a page of
 * the router, the application around them as it starts; the server is a fake, and so is the reload of the window. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const OTHER_LICENCE = /^\/adm\/v1\/asset-licence\/2$/
const CURRENT_USER = /^\/adm\/users\/current$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/

const UPDATED = 'Record was updated'
const CREATED = 'Record was created'
const CHANGE_LICENCE = 'Switch Media Library ext system and asset licence'

const PAGE = '/assets'
const ELSEWHERE = '/settings'

const settled = () => vi.advanceTimersByTimeAsync(100)

const dialogSaying = (text: string) =>
  Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find((found) =>
    found.textContent?.includes(text)
  ) ?? null

/** The page with the menu, opened. */
const openMenu = async () => {
  const ui = await startUploadUi({ server, grants: ['dam_asset_create', 'dam_asset_update'] })
  // The licences a user picks from.
  const config = ui.library.useDamConfigStore()
  config.damPrvConfig = {
    ...config.damPrvConfig,
    settings: { ...config.damPrvConfig.settings, allowSelectExtSystem: true, allowSelectLicenceId: true },
  }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    userToExtSystemsDto: [{ id: 1, name: 'Ext system' }],
    assetLicencesDto: [
      { id: 1, name: 'Licence', extSystem: 1 },
      { id: 2, name: 'Other licence', extSystem: 1 },
    ],
  } as never)
  const Menu = (await import('@/domains/coreDam/asset/components/toolbar/AssetToolbarOptions.vue')).default
  ui.router.addRoute({ path: PAGE, name: '/(coreDam)/assets', component: Menu })
  ui.router.addRoute({ path: ELSEWHERE, component: { render: () => null } })
  await ui.router.push(PAGE)
  const page = await ui.mount(async () => ({ default: RouterView }))
  page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()

  return {
    ...ui,
    at: () => ui.router.currentRoute.value.path,
    /** A link of the application to another page followed, as Vuetify lets it past an open dialog. */
    leave: async () => {
      void ui.router.push(ELSEWHERE)
      await settled()
    },
    item: (dataCy: string) =>
      eventually(() => {
        const found = document.body.querySelector<HTMLElement>(`[data-cy="${dataCy}"]`)
        expect(found).not.toBeNull()

        return found!
      }),
  }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('PATCH', CURRENT_USER, () => ({ status: 200, data: { id: 7 } }))
  vi.spyOn(window.location, 'reload').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  stopUploadUi()
})

describe('a dialog of the menu of the page while its request is on its way', () => {
  it('the change of the licence: keeps the page, and the dialog, until the change is answered', async () => {
    let answer: () => void = () => undefined
    server.on(
      'GET',
      OTHER_LICENCE,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 200, data: { id: 2, name: 'Other licence', extSystem: 1 } })
        })
    )
    const menu = await openMenu()
    ;(await menu.item('button-switch-licence')).click()
    const dialog = await eventually(() => {
      const open = dialogSaying(CHANGE_LICENCE)
      expect(open).not.toBeNull()

      return open!
    })
    const licence = Array.from(dialog.querySelectorAll<HTMLElement>('.v-select'))[1]
    licence.querySelector('.v-field')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const other = await eventually(() => {
      const option = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
        (found) => found.textContent?.trim() === 'Other licence'
      )
      expect(option).toBeTruthy()

      return option!
    })
    other.click()
    await settled()
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
    await settled()

    await menu.leave()

    expect([menu.at(), dialogSaying(CHANGE_LICENCE) === dialog]).toEqual([PAGE, true])

    answer()
    await eventually(() => expect(window.location.reload).toHaveBeenCalledTimes(1))
    expect(menu.alerts()).toEqual([UPDATED])
    // Answered, the dialog holds nothing back: the page can be left.
    await menu.leave()
    expect(menu.at()).toBe(ELSEWHERE)
  })

  it('"Create empty asset": keeps the page, and the dialog, until the asset is made', async () => {
    let answer: () => void = () => undefined
    server.on(
      'POST',
      CREATE,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 201, data: { ...assetDetail('asset-new'), keywords: [], authors: [] } })
        })
    )
    const menu = await openMenu()
    ;(await menu.item('button-main-empty-asset')).click()
    const panel = await menu.item('create-panel')
    panel.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
    await eventually(() => expect(server.sent('POST', CREATE)).toHaveLength(1))

    await menu.leave()

    expect([menu.at(), panel.isConnected]).toEqual([PAGE, true])

    answer()
    await eventually(() => expect(menu.alerts()).toEqual([CREATED]))
    await menu.leave()
    expect(menu.at()).toBe(ELSEWHERE)
  })
})
