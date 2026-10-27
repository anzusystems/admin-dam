import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Two dialogs of the distributions tab: stopping a waiting distribution, and the
 * advanced settings that edit a distribution record. Real tab and dialogs, fake server.
 * Start as in `distributionManageDelete.test.ts`, plus the asset
 * in the detail store: the settings dialog reads its slots.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SERVICE = 'custom_main'
const LIST = /^\/adm\/v1\/distribution\/asset\/asset-1$/
const STOP = /^\/adm\/v1\/custom-distribution\/[^/]+$/
const SAVE = /^\/adm\/v1\/distribution$/

const STOP_DISTRIBUTION = 'Stop distribution'
const SHOW_SETTINGS = 'Show advanced distribution management'
const CONFIRM = 'Confirm'
const CANCEL = 'Cancel'
const REMOVED = 'Record was removed'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const LOAD_FAILED = 'The distributions could not be loaded.'
const NOTHING_TO_SHOW = 'Nothing to show'

const distribution = (id: string, status = 'distributed') => ({
  id,
  assetId: 'asset-1',
  assetFileId: 'file-1',
  extId: 'remote-' + id,
  distributionService: SERVICE,
  status,
  failReason: 'none',
  blockedBy: [],
  publishAt: null,
  customData: {},
  distributionData: {},
  _resourceName: 'distribution',
})

let listed: ReturnType<typeof distribution>[] = []
const listAnswer = (): FakeDamAnswer => ({ status: 200, data: { data: structuredClone(listed) } })

const openTab = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_distribution_access', 'dam_distribution_update'],
    extSystem: {
      video: {
        distribution: {
          distributionServices: [SERVICE],
          distributionRequirements: { [SERVICE]: { title: 'Custom service', requiredAuth: false, blockedBy: [] } },
        },
      } as never,
    },
  })
  const config = ui.library.useDamConfigStore()
  config.damPrvConfig = {
    ...config.damPrvConfig,
    distributionServices: {
      [SERVICE]: {
        title: 'Custom service',
        iconPath: '',
        type: ui.library.DamDistributionServiceType.Custom,
        allowedRedistributeStatuses: [],
      },
    },
  }
  // Services of the account. Only distributions to these services can be redistributed and managed.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({ ...currentUser.value, allowedDistributionServices: [SERVICE] } as never)
  const asset = assetDetail('asset-1', { attributes: { assetType: 'video', assetStatus: 'with_file' } })
  server.asset({ ...asset, keywords: [], authors: [] })
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  useAssetDetailStore().setAsset({ ...asset, keywords: [], authors: [] } as never)

  const tab = await ui.mount(
    () =>
      import('@/domains/coreDam/asset/components/detail/components/distribution/AssetDetailSidebarDistribution.vue'),
    { isActive: true, assetType: 'video', assetId: 'asset-1', assetMainFileStatus: 'processed' }
  )
  const shown = () =>
    Array.from(tab.querySelectorAll('.mx-4 > .d-flex')).map((row) => row.textContent?.match(/remote-[\w-]+/)?.[0])
  await eventually(() => expect(shown()).toEqual(listed.map((item) => item.extId)))

  return {
    ...ui,
    tab,
    shown,
    says: (text: string) => tab.textContent?.includes(text) ?? false,
    tryAgain: () => tab.querySelector<HTMLButtonElement>('[data-cy="distribution-list-retry"]'),
    confirm: () =>
      eventually(() => {
        const button = dialogButton(CONFIRM)
        expect(button).not.toBeNull()

        return button!
      }),
  }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', LIST, listAnswer)
})

afterEach(() => {
  stopUploadUi()
})

describe('the dialog that stops a waiting distribution', () => {
  const asked = async (distributions = [distribution('dist-1', 'waiting'), distribution('dist-2')]) => {
    listed = distributions
    const ui = await openTab()
    buttonsNamed(ui.tab, STOP_DISTRIBUTION)[0].click()

    return { ...ui, confirm: await ui.confirm() }
  }

  it('closes and says the record was removed once the server stopped it, and the tab reads its list anew', async () => {
    server.on('DELETE', STOP, () => ({ status: 204 }))
    const ui = await asked()
    listed = [distribution('dist-2')]

    ui.confirm.click()

    await eventually(() => expect(ui.alerts()).toEqual([REMOVED]))
    expect(dialogButton(CONFIRM)).toBeNull()
    expect(server.sent('DELETE', STOP).map((request) => request.url)).toEqual(['/adm/v1/custom-distribution/dist-1'])
    // Read at once because the dialog asked for it. On its own the tab reads 15 seconds after its last read.
    await vi.advanceTimersByTimeAsync(100)
    expect([ui.shown(), server.sent('GET', LIST).length]).toEqual([['remote-dist-2'], 2])
  })

  /*
   * The stopped distribution leaves the list before the tab reads again, whatever that read does. Otherwise
   * a failed read leaves it waiting with a stop button that asks the server to stop what is gone.
   */
  it('is gone from the list when the read after the stop fails, and the other distribution stays', async () => {
    server.on('DELETE', STOP, () => ({ status: 204 }))
    const ui = await asked()
    server.on('GET', LIST, () => {
      throw httpError(500)
    })

    ui.confirm.click()

    await eventually(() => expect(ui.alerts()).toEqual([REMOVED, SYSTEM_ERROR]))
    await vi.advanceTimersByTimeAsync(100)
    expect([ui.shown(), buttonsNamed(ui.tab, STOP_DISTRIBUTION).length]).toEqual([['remote-dist-2'], 0])
    expect([ui.says(LOAD_FAILED), ui.tryAgain(), server.sent('GET', LIST).length]).toEqual([false, null, 2])
    expect(dialogButton(CONFIRM)).toBeNull()
  })

  it('leaves the tab saying its list could not be loaded when it was the last one and the read after fails', async () => {
    server.on('DELETE', STOP, () => ({ status: 204 }))
    const ui = await asked([distribution('dist-1', 'waiting')])
    let down = true
    server.on('GET', LIST, () => {
      if (down) throw httpError(500)

      return listAnswer()
    })
    listed = []

    ui.confirm.click()

    await eventually(() => expect(ui.alerts()).toEqual([REMOVED, SYSTEM_ERROR]))
    await vi.advanceTimersByTimeAsync(100)
    expect([ui.shown(), buttonsNamed(ui.tab, STOP_DISTRIBUTION).length]).toEqual([[], 0])
    expect([ui.says(LOAD_FAILED), ui.says(NOTHING_TO_SHOW)]).toEqual([true, false])

    down = false
    ui.tryAgain()?.click()

    await eventually(() => expect(ui.says(NOTHING_TO_SHOW)).toBe(true))
    expect([ui.says(LOAD_FAILED), ui.tryAgain(), server.sent('GET', LIST).length]).toEqual([false, null, 3])
  })

  /*
   * Enter or space on a button arrives as a click and the spinning button accepts it. Only the pointer is kept off.
   * The page here does not turn a key into a click, so the click is sent directly.
   */
  it('asks the server once, however often "Confirm" is pressed while it spins', async () => {
    let answer: () => void = () => undefined
    server.on('DELETE', STOP, () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve({ status: 204 }))))
    const ui = await asked()
    listed = [distribution('dist-2')]

    ui.confirm.click()
    await eventually(() => expect(server.sent('DELETE', STOP)).toHaveLength(1))
    await eventually(() => expect(ui.confirm.classList.contains('v-btn--loading')).toBe(true))
    ui.confirm.click()
    ui.confirm.click()
    await vi.advanceTimersByTimeAsync(100)

    expect(server.sent('DELETE', STOP)).toHaveLength(1)

    answer()

    await eventually(() => expect(ui.alerts()).toEqual([REMOVED]))
    await vi.advanceTimersByTimeAsync(100)
    expect([server.sent('DELETE', STOP).length, ui.alerts(), server.sent('GET', LIST).length]).toEqual([
      1,
      [REMOVED],
      2,
    ])
    expect(dialogButton(CONFIRM)).toBeNull()
  })

  /*
   * One dialog serves all rows and can be closed while the server is
   * still asked. "Confirm" then spun for the second row and sent nothing.
   */
  it('stops another distribution it was opened for meanwhile at once, while the first one is still asked about', async () => {
    const stopped = () => server.sent('DELETE', STOP).map((request) => request.url)
    let answerFirst: () => void = () => undefined
    server.on('DELETE', STOP, () => {
      if (stopped().length > 1) return { status: 204 }

      return new Promise<FakeDamAnswer>((resolve) => (answerFirst = () => resolve({ status: 204 })))
    })
    listed = [distribution('dist-1', 'waiting'), distribution('dist-2', 'waiting')]
    const ui = await openTab()
    buttonsNamed(ui.tab, STOP_DISTRIBUTION)[0].click()
    ;(await ui.confirm()).click()
    await eventually(() => expect(stopped()).toEqual(['/adm/v1/custom-distribution/dist-1']))

    dialogButton(CANCEL)?.click()
    await eventually(() => expect(dialogButton(CONFIRM)).toBeNull())
    buttonsNamed(ui.tab, STOP_DISTRIBUTION)[1].click()
    const ofTheSecond = await ui.confirm()
    expect(ofTheSecond.classList.contains('v-btn--loading')).toBe(false)

    listed = [distribution('dist-1', 'waiting')]
    ofTheSecond.click()

    await eventually(() => expect(ui.alerts()).toEqual([REMOVED]))
    expect(stopped()).toEqual(['/adm/v1/custom-distribution/dist-1', '/adm/v1/custom-distribution/dist-2'])
    expect(dialogButton(CONFIRM)).toBeNull()

    listed = []
    answerFirst()

    await eventually(() => expect(ui.alerts()).toEqual([REMOVED, REMOVED]))
    await vi.advanceTimersByTimeAsync(100)
    expect([ui.shown(), server.sent('GET', LIST).length]).toEqual([[], 3])
  })

  it('stays open with the error, and nothing is read again, when the server refuses to stop it', async () => {
    server.on('DELETE', STOP, () => {
      throw httpError(500)
    })
    const ui = await asked()

    ui.confirm.click()

    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    const confirm = dialogButton(CONFIRM)
    expect([confirm === null, confirm?.classList.contains('v-btn--loading')]).toEqual([false, false])
    expect([ui.shown(), server.sent('GET', LIST).length]).toEqual([['remote-dist-1', 'remote-dist-2'], 1])
  })
})

describe('the dialog of the advanced settings that edits the record of a distribution', () => {
  const saved = () => server.sent('PATCH', SAVE).map((request) => JSON.parse(request.data as string))

  const editing = async () => {
    listed = [distribution('dist-1'), distribution('dist-2')]
    const ui = await openTab()
    buttonsNamed(ui.tab, SHOW_SETTINGS)[0].click()
    const edit = async () => {
      const pencil = await eventually(() => {
        const button = ui.tab.querySelector<HTMLButtonElement>('.a-le-row .a-le-action--edit')
        expect(button).not.toBeNull()

        return button!
      })
      pencil.click()

      return ui.confirm()
    }

    return { ...ui, edit, confirm: await edit() }
  }

  const close = () => document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-close"]')

  it('spins "Confirm" while the save is on its way and sends it once, however often it is pressed', async () => {
    let answer: () => void = () => undefined
    server.on(
      'PATCH',
      SAVE,
      (request) =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 200, data: JSON.parse(request.data as string) })
        })
    )
    const ui = await editing()

    ui.confirm.click()
    await eventually(() => expect(saved()).toHaveLength(1))
    await eventually(() => expect(ui.confirm.classList.contains('v-btn--loading')).toBe(true))
    ui.confirm.click()
    ui.confirm.click()
    await vi.advanceTimersByTimeAsync(100)

    expect(saved()).toEqual([expect.objectContaining({ id: 'dist-1', extId: 'remote-dist-1' })])

    answer()

    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    expect(dialogButton(CONFIRM)).toBeNull()
    await eventually(() => expect(server.sent('GET', LIST)).toHaveLength(2))
    await vi.advanceTimersByTimeAsync(100)
    expect([saved().length, ui.alerts(), server.sent('GET', LIST).length]).toEqual([1, [UPDATED], 2])
  })

  /*
   * Closing during the save would unmount the dialog. The save goes through and is announced, but nobody
   * hears of it, the list is not read again, and the next pencil fills the form from the old row.
   */
  it('cannot be closed by "Cancel" or by the X while the save is on its way: the list is read once it is saved', async () => {
    let answer: () => void = () => undefined
    server.on(
      'PATCH',
      SAVE,
      (request) =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 200, data: JSON.parse(request.data as string) })
        })
    )
    const ui = await editing()
    const cancel = dialogButton(CANCEL)
    expect(cancel?.disabled).toBe(false)

    ui.confirm.click()
    await eventually(() => expect(ui.confirm.classList.contains('v-btn--loading')).toBe(true))
    expect([cancel?.disabled, close() === null]).toEqual([true, false])
    cancel?.click()
    close()?.click()
    await vi.advanceTimersByTimeAsync(100)

    expect([dialogButton(CONFIRM), dialogButton(CANCEL), saved().length]).toEqual([ui.confirm, cancel, 1])
    expect(server.sent('GET', LIST)).toHaveLength(1)

    listed = [{ ...distribution('dist-1'), extId: 'remote-dist-1-saved' }, distribution('dist-2')]
    answer()

    await eventually(() => expect(ui.alerts()).toEqual([UPDATED]))
    expect(dialogButton(CONFIRM)).toBeNull()
    await eventually(() => expect(ui.shown()).toEqual(['remote-dist-1-saved', 'remote-dist-2']))
    expect(server.sent('GET', LIST)).toHaveLength(2)

    await ui.edit()
    const typed = Array.from(document.body.querySelectorAll<HTMLInputElement>('.v-dialog input')).map(
      (input) => input.value
    )
    expect(typed).toContain('remote-dist-1-saved')
  })

  it('closes by "Cancel" and by the X while nothing is being saved, also after a save the server refused', async () => {
    server.on('PATCH', SAVE, () => {
      throw httpError(500)
    })
    const ui = await editing()

    dialogButton(CANCEL)?.click()
    await eventually(() => expect(dialogButton(CONFIRM)).toBeNull())
    expect(saved()).toHaveLength(0)

    ;(await ui.edit()).click()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    expect(dialogButton(CANCEL)?.disabled).toBe(false)
    close()?.click()

    await eventually(() => expect(dialogButton(CONFIRM)).toBeNull())
    expect([saved().length, server.sent('GET', LIST).length]).toEqual([1, 1])
  })

  it('can be confirmed again after a save the server refused: the button no longer spins', async () => {
    let down = true
    server.on('PATCH', SAVE, (request) => {
      if (down) throw httpError(500)

      return { status: 200, data: JSON.parse(request.data as string) }
    })
    const ui = await editing()

    ui.confirm.click()

    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    expect([dialogButton(CONFIRM), ui.confirm.classList.contains('v-btn--loading')]).toEqual([ui.confirm, false])

    down = false
    ui.confirm.click()

    await eventually(() => expect(ui.alerts()).toContain(UPDATED))
    expect([saved().length, dialogButton(CONFIRM)]).toEqual([2, null])
  })
})
