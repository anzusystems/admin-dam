import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The licence is changed in a menu dialog: the licence is read, the change is sent, and the page is reloaded.
 * While that runs, the confirm button spins and a second confirm does
 * nothing. Before, the same change was read, sent and reloaded twice.
 * The dialog also cannot be closed meanwhile: the guard against a second
 * confirm goes with the dialog, and a reopened one would send the change again.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const OTHER_LICENCE = /^\/adm\/v1\/asset-licence\/2$/
const CURRENT_USER = /^\/adm\/users\/current$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const CHANGE_LICENCE = 'Switch Media Library ext system and asset licence'

const settled = () => vi.advanceTimersByTimeAsync(100)

const dismiss = async (dialog: Element) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settled()
  const scrim = dialog.closest('.v-overlay')!.querySelector<HTMLElement>('.v-overlay__scrim')!
  scrim.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  scrim.click()
  await settled()
}

const sent = () => [server.sent('GET', OTHER_LICENCE).length, server.sent('PATCH', CURRENT_USER).length]

const spins = (button: HTMLButtonElement) => button.classList.contains('v-btn--loading')

const withTheOtherLicencePicked = async () => {
  const ui = await startUploadUi({ server, grants: ['dam_asset_update'] })
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
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  const menu = await ui.mount(() => import('@/domains/coreDam/asset/components/toolbar/AssetToolbarOptions.vue'))
  menu.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
  const item = await eventually(() => {
    const found = document.body.querySelector<HTMLElement>('[data-cy="button-switch-licence"]')
    expect(found).not.toBeNull()

    return found!
  })
  item.click()
  const dialog = await eventually(() => {
    const open = Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find((found) =>
      found.textContent?.includes(CHANGE_LICENCE)
    )
    expect(open).toBeTruthy()

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

  return {
    ...ui,
    confirm: dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!,
    cross: dialog.querySelector('.v-toolbar .mdi-close')!.closest('button')!,
    cancel: dialog.querySelector<HTMLButtonElement>('button[data-cy="button-cancel"]')!,
    isOpen: () => dialog.isConnected && dialog.classList.contains('v-overlay--active'),
    dismiss: () => dismiss(dialog),
  }
}

let reload: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', OTHER_LICENCE, () => ({ status: 200, data: { id: 2, name: 'Other licence', extSystem: 1 } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('PATCH', CURRENT_USER, () => ({ status: 200, data: { id: 7 } }))
  reload = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined)
})

afterEach(() => {
  reload.mockRestore()
  stopUploadUi()
})

describe('the dialog that changes the licence', () => {
  it('takes one confirm while the change is on its way, and its button spins meanwhile', async () => {
    let answerLicence: () => void = () => undefined
    server.on(
      'GET',
      OTHER_LICENCE,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answerLicence = () => resolve({ status: 200, data: { id: 2, name: 'Other licence', extSystem: 1 } })
        })
    )
    const dialog = await withTheOtherLicencePicked()
    expect(spins(dialog.confirm)).toBe(false)

    dialog.confirm.click()
    await settled()
    expect([sent(), spins(dialog.confirm)]).toEqual([[1, 0], true])

    dialog.confirm.click()
    await settled()
    expect(sent()).toEqual([1, 0])

    answerLicence()
    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    await settled()
    expect([sent(), reload.mock.calls.length, dialog.alerts()]).toEqual([[1, 1], 1, [UPDATED]])
    expect(JSON.parse(server.sent('PATCH', CURRENT_USER)[0].data as string)).toEqual({ selectedLicence: 2 })
  })

  it('can be confirmed again after a change the server refused: its button spins no more', async () => {
    let refuse = true
    server.on('PATCH', CURRENT_USER, () => {
      if (refuse) throw httpError(500)

      return { status: 200, data: { id: 7 } }
    })
    const dialog = await withTheOtherLicencePicked()

    dialog.confirm.click()
    await eventually(() => expect(dialog.alerts()).toEqual([SYSTEM_ERROR]))
    expect([sent(), reload.mock.calls.length, spins(dialog.confirm)]).toEqual([[1, 1], 0, false])

    refuse = false
    dialog.confirm.click()

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(sent()).toEqual([2, 2])
  })

  /*
   * "Cancel" used to close the dialog while the change was on its way.
   * A dialog reopened from the menu knew nothing of it, and confirming
   * sent the change a second time under the reload of the first.
   */
  it('cannot be closed while the change is on its way, and can be after a change the server refused', async () => {
    let refuseLicence: () => void = () => undefined
    server.on(
      'GET',
      OTHER_LICENCE,
      () => new Promise<FakeDamAnswer>((_resolve, reject) => (refuseLicence = () => reject(httpError(500))))
    )
    const dialog = await withTheOtherLicencePicked()
    expect(dialog.cancel.disabled).toBe(false)

    dialog.confirm.click()
    await settled()
    expect(dialog.cancel.disabled).toBe(true)
    dialog.cross.click()
    await settled()

    expect([dialog.isOpen(), spins(dialog.confirm), sent()]).toEqual([true, true, [1, 0]])

    refuseLicence()
    await eventually(() => expect(dialog.alerts()).toEqual([SYSTEM_ERROR]))
    expect([dialog.cancel.disabled, reload.mock.calls.length]).toEqual([false, 0])
    dialog.cross.click()
    await eventually(() => expect(dialog.isOpen()).toBe(false))
  })

  /*
   * Escape and a press outside do not close it either.
   * The library sets every dialog up as persistent, so neither ever closes one.
   */
  it('is not closed by Escape nor by a press outside it while the change is on its way', async () => {
    let answerLicence: () => void = () => undefined
    server.on(
      'GET',
      OTHER_LICENCE,
      () =>
        new Promise<FakeDamAnswer>((resolve) => {
          answerLicence = () => resolve({ status: 200, data: { id: 2, name: 'Other licence', extSystem: 1 } })
        })
    )
    const dialog = await withTheOtherLicencePicked()

    dialog.confirm.click()
    await settled()
    await dialog.dismiss()

    expect([dialog.isOpen(), spins(dialog.confirm), sent()]).toEqual([true, true, [1, 0]])

    answerLicence()
    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(sent()).toEqual([1, 1])
  })
})
