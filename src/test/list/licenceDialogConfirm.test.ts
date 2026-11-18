import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The licence is changed in a dialog of the list view switch: the change is sent, and the asset list is loaded anew.
 * While that runs, the confirm button spins and a second confirm does
 * nothing. Before, the same change was sent and the page reloaded twice.
 * The dialog also cannot be closed meanwhile: closing it would not stop the change, the page still goes.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const CURRENT_USER = /^\/adm\/users\/current$/

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

const sent = () => server.sent('PATCH', CURRENT_USER).length

const spins = (button: HTMLButtonElement) => button.classList.contains('v-btn--loading')

const withTheOtherLicencePicked = async ({ queued = false } = {}) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update'],
    queues: queued ? { global: [queueRow({ status: 'uploaded', assetId: 'asset-9', fileId: 'file-9' })] } : {},
  })
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
    resolvedAssetLicences: [
      { id: 1, name: 'Licence', extSystem: 1 },
      { id: 2, name: 'Other licence', extSystem: 1 },
    ],
  } as never)
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: { render: () => null } })
  const listViewSwitch = await ui.mount(
    () => import('@/domains/coreDam/asset/components/toolbar/AssetToolbarListViewSwitch.vue')
  )
  Array.from(listViewSwitch.querySelectorAll<HTMLButtonElement>('.v-btn'))
    .find((button) => button.querySelector('.mdi-chevron-down'))!
    .click()
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
    const option = Array.from(document.body.querySelectorAll<HTMLElement>('.v-select__content .v-list-item')).find(
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

const held = () => {
  let answer: () => void = () => undefined
  let refuse: () => void = () => undefined
  server.on(
    'PATCH',
    CURRENT_USER,
    () =>
      new Promise<FakeDamAnswer>((resolve, reject) => {
        answer = () => resolve({ status: 200, data: { id: 7 } })
        refuse = () => reject(httpError(500))
      })
  )

  return { answer: () => answer(), refuse: () => refuse() }
}

let assign: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('PATCH', CURRENT_USER, () => ({ status: 200, data: { id: 7 } }))
  assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined)
})

afterEach(() => {
  assign.mockRestore()
  stopUploadUi()
})

describe('the dialog that changes the licence', () => {
  it('takes one confirm while the change is on its way, and its button spins meanwhile', async () => {
    const change = held()
    const dialog = await withTheOtherLicencePicked()
    expect(spins(dialog.confirm)).toBe(false)

    dialog.confirm.click()
    await settled()
    expect([sent(), spins(dialog.confirm)]).toEqual([1, true])

    dialog.confirm.click()
    await settled()
    expect(sent()).toBe(1)

    change.answer()
    await eventually(() => expect(assign).toHaveBeenCalledTimes(1))
    await settled()
    expect([sent(), assign.mock.calls, dialog.alerts()]).toEqual([1, [['/assets']], []])
    // The page has not gone yet. The dialog is closed by then, so it is not confirmed a second time.
    await eventually(() => expect(dialog.isOpen()).toBe(false))
    dialog.confirm.click()
    await settled()
    expect(sent()).toBe(1)
    expect(JSON.parse(server.sent('PATCH', CURRENT_USER)[0].data as string)).toEqual({
      selectedLicence: 2,
      selectedListView: null,
    })
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
    expect([sent(), assign.mock.calls.length, spins(dialog.confirm)]).toEqual([1, 0, false])

    refuse = false
    dialog.confirm.click()

    await eventually(() => expect(assign).toHaveBeenCalledTimes(1))
    expect(sent()).toBe(2)
  })

  /*
   * "Cancel" used to close the dialog while the change was on its way.
   * A dialog reopened from the menu knew nothing of it, and confirming
   * sent the change a second time under the reload of the first.
   */
  it('cannot be closed while the change is on its way, and can be after a change the server refused', async () => {
    const change = held()
    const dialog = await withTheOtherLicencePicked()
    expect(dialog.cancel.disabled).toBe(false)

    dialog.confirm.click()
    await settled()
    expect(dialog.cancel.disabled).toBe(true)
    dialog.cross.click()
    await settled()

    expect([dialog.isOpen(), spins(dialog.confirm), sent()]).toEqual([true, true, 1])

    change.refuse()
    await eventually(() => expect(dialog.alerts()).toEqual([SYSTEM_ERROR]))
    expect([dialog.cancel.disabled, assign.mock.calls.length]).toEqual([false, 0])
    dialog.cross.click()
    await eventually(() => expect(dialog.isOpen()).toBe(false))
  })

  /*
   * Escape and a press outside do not close it either.
   * The library sets every dialog up as persistent, so neither ever closes one.
   */
  it('is not closed by Escape nor by a press outside it while the change is on its way', async () => {
    const change = held()
    const dialog = await withTheOtherLicencePicked()

    dialog.confirm.click()
    await settled()
    await dialog.dismiss()

    expect([dialog.isOpen(), spins(dialog.confirm), sent()]).toEqual([true, true, 1])

    change.answer()
    await eventually(() => expect(assign).toHaveBeenCalledTimes(1))
    expect(sent()).toBe(1)
  })
})

// With rows in a queue the switch first asks to finish all work. That question holds the change the same way.
describe('the question to finish all work first, asked while a queue holds rows', () => {
  it('cannot be closed while the change is on its way, and can be after a change the server refused', async () => {
    const change = held()
    const dialog = await withTheOtherLicencePicked({ queued: true })
    dialog.confirm.click()
    const confirm = await eventually(() => {
      const found = document.body.querySelector<HTMLButtonElement>('[data-cy="button-confirm-list-view-switch"]')
      expect(found).not.toBeNull()

      return found!
    })
    const question = confirm.closest('.v-overlay')!
    const cancel = question.querySelector<HTMLButtonElement>('[data-cy="button-cancel-list-view-switch"]')!
    const cross = question.querySelector('.v-toolbar .mdi-close')!.closest('button')!
    const isOpen = () => question.isConnected && question.classList.contains('v-overlay--active')
    expect([sent(), cancel.disabled]).toEqual([0, false])

    confirm.click()
    await settled()
    expect(cancel.disabled).toBe(true)
    cross.click()
    cancel.click()
    await settled()

    expect([isOpen(), spins(confirm), sent()]).toEqual([true, true, 1])

    change.refuse()
    await eventually(() => expect(dialog.alerts()).toEqual([SYSTEM_ERROR]))
    expect([cancel.disabled, assign.mock.calls.length]).toEqual([false, 0])
    cross.click()
    await eventually(() => expect(isOpen()).toBe(false))
  })

  it('is closed once the change went through, while the page goes', async () => {
    const change = held()
    const dialog = await withTheOtherLicencePicked({ queued: true })
    dialog.confirm.click()
    const confirm = await eventually(() => {
      const found = document.body.querySelector<HTMLButtonElement>('[data-cy="button-confirm-list-view-switch"]')
      expect(found).not.toBeNull()

      return found!
    })
    const question = confirm.closest('.v-overlay')!
    const cancel = question.querySelector<HTMLButtonElement>('[data-cy="button-cancel-list-view-switch"]')!

    confirm.click()
    await settled()
    change.answer()
    await eventually(() => expect(assign).toHaveBeenCalledTimes(1))
    await eventually(() => expect(question.isConnected && question.classList.contains('v-overlay--active')).toBe(false))
    confirm.click()
    cancel.click()
    await settled()

    expect([sent(), assign.mock.calls.length]).toEqual([1, 1])
  })
})
