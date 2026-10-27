import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Deleting a distribution in the advanced settings of the distributions
 * tab. Real tab, settings and library list editor over a fake server.
 * The tab and the settings draw the same list under one loader. The delete turns it on
 * and, after a successful delete, it stays on until the tab has read the list again.
 * The tab reads when the settings tell it of the delete. The deleted
 * distribution leaves the list before that, whatever the read does.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SERVICE = 'custom_main'
const LIST = /^\/adm\/v1\/distribution\/asset\/asset-1$/
const ONE = /^\/adm\/v1\/distribution\/[^/]+$/

const SHOW_SETTINGS = 'Show advanced distribution management'
const HIDE_SETTINGS = 'Hide advanced distribution management'
const DELETE = 'Delete'
const REMOVED = 'Record was removed'
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

const openSettings = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_distribution_access', 'dam_distribution_delete'],
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

  const tab = await ui.mount(
    () =>
      import('@/domains/coreDam/asset/components/detail/components/distribution/AssetDetailSidebarDistribution.vue'),
    { isActive: true, assetType: 'video', assetId: 'asset-1', assetMainFileStatus: 'processed' }
  )
  const managed = () =>
    Array.from(tab.querySelectorAll('.a-le-row')).map((row) => row.textContent?.match(/remote-[\w-]+/)?.[0])
  await eventually(() => expect(tab.textContent).toContain('remote-dist-1'))
  buttonsNamed(tab, SHOW_SETTINGS)[0].click()
  await eventually(() => expect(managed()).toEqual(listed.map((item) => item.extId)))

  return {
    ...ui,
    managed,
    shows: (id: string) => tab.textContent?.includes('remote-' + id) ?? false,
    says: (text: string) => tab.textContent?.includes(text) ?? false,
    tryAgain: () => tab.querySelector<HTMLButtonElement>('[data-cy="distribution-list-retry"]'),
    spinners: () => tab.querySelectorAll('.v-progress-circular').length,
    bins: () => tab.querySelectorAll('.a-le-action--delete').length,
    hide: () => buttonsNamed(tab, HIDE_SETTINGS)[0].click(),
    remove: async (id: string) => {
      const row = Array.from(tab.querySelectorAll('.a-le-row')).find((found) =>
        found.textContent?.includes('remote-' + id)
      )
      row?.querySelector<HTMLButtonElement>('.a-le-action--delete')?.click()
      const confirm = await eventually(() => {
        const button = dialogButton(DELETE)
        expect(button).not.toBeNull()

        return button
      })
      confirm?.click()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  listed = [distribution('dist-1'), distribution('dist-2')]
  server.on('GET', LIST, listAnswer)
  server.on('DELETE', ONE, () => ({ status: 204 }))
})

afterEach(() => {
  stopUploadUi()
})

describe('a distribution deleted in the advanced settings of the distributions tab', () => {
  it('does not show again while the tab reads its list anew: the loader stays until the list is there', async () => {
    const settings = await openSettings()
    let answer: (list: FakeDamAnswer) => void = () => undefined
    server.on('GET', LIST, () => new Promise<FakeDamAnswer>((resolve) => (answer = resolve)))

    await settings.remove('dist-1')
    await eventually(() => expect(server.sent('GET', LIST)).toHaveLength(2))

    expect(server.sent('DELETE', ONE).map((request) => request.url)).toEqual(['/adm/v1/distribution/dist-1'])
    await eventually(() => expect(settings.alerts()).toEqual([REMOVED]))
    expect([settings.spinners(), settings.managed(), settings.bins()]).toEqual([2, [], 0])
    expect([settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([false, false])

    listed = [distribution('dist-2')]
    answer(listAnswer())

    await eventually(() => expect(settings.managed()).toEqual(['remote-dist-2']))
    expect([settings.spinners(), settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([0, false, true])
    expect(server.sent('DELETE', ONE)).toHaveLength(1)
  })

  it('is gone from the tab and from its settings when the read after the delete fails', async () => {
    const settings = await openSettings()
    server.on('GET', LIST, () => {
      throw httpError(500)
    })

    await settings.remove('dist-1')

    await eventually(() => expect(settings.alerts()).toEqual([REMOVED, SYSTEM_ERROR]))
    await eventually(() => expect(settings.managed()).toEqual(['remote-dist-2']))
    expect([settings.spinners(), settings.bins()]).toEqual([0, 1])
    expect([settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([false, true])
    expect([settings.says(LOAD_FAILED), settings.tryAgain(), server.sent('GET', LIST).length]).toEqual([false, null, 2])
  })

  it('leaves the tab saying its list could not be loaded when it was the last one and the read after fails', async () => {
    listed = [distribution('dist-1')]
    const settings = await openSettings()
    let down = true
    server.on('GET', LIST, () => {
      if (down) throw httpError(500)

      return listAnswer()
    })
    listed = []

    await settings.remove('dist-1')

    await eventually(() => expect(settings.alerts()).toEqual([REMOVED, SYSTEM_ERROR]))
    await eventually(() => expect(settings.spinners()).toBe(0))
    expect([settings.shows('dist-1'), settings.managed(), settings.bins()]).toEqual([false, [], 0])
    expect([settings.says(LOAD_FAILED), settings.says(NOTHING_TO_SHOW)]).toEqual([true, false])

    down = false
    settings.tryAgain()?.click()

    await eventually(() => expect(settings.says(NOTHING_TO_SHOW)).toBe(true))
    expect([settings.says(LOAD_FAILED), settings.tryAgain(), server.sent('GET', LIST).length]).toEqual([false, null, 3])
  })

  it('leaves no loader on, and is gone, when the settings were hidden while the delete was on its way', async () => {
    const settings = await openSettings()
    let answer: (deleted: FakeDamAnswer) => void = () => undefined
    server.on('DELETE', ONE, () => new Promise<FakeDamAnswer>((resolve) => (answer = resolve)))
    await settings.remove('dist-1')
    await eventually(() => expect(server.sent('DELETE', ONE)).toHaveLength(1))

    settings.hide()
    await eventually(() => expect(settings.spinners()).toBe(1))
    answer({ status: 204 })

    await eventually(() => expect(settings.alerts()).toEqual([REMOVED]))
    expect(settings.spinners()).toBe(0)
    expect([server.sent('GET', LIST).length, settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([
      1,
      false,
      true,
    ])
  })

  /*
   * The tab reads behind its list while a distribution is in progress, deleted or not.
   * A read sent before the server deleted answers with the deleted distribution.
   * With the settings hidden, nothing discards that answer.
   */
  it('is not put back by a read behind the list that was on its way when it was deleted', async () => {
    listed = [distribution('dist-1'), distribution('dist-2', 'distributing')]
    const settings = await openSettings()
    let answerRead: (list: FakeDamAnswer) => void = () => undefined
    server.on('GET', LIST, () => new Promise<FakeDamAnswer>((resolve) => (answerRead = resolve)))
    let answerDelete: (deleted: FakeDamAnswer) => void = () => undefined
    server.on('DELETE', ONE, () => new Promise<FakeDamAnswer>((resolve) => (answerDelete = resolve)))
    await settings.remove('dist-1')
    await eventually(() => expect(server.sent('DELETE', ONE)).toHaveLength(1))
    settings.hide()
    await eventually(() => expect(settings.spinners()).toBe(1))
    await vi.advanceTimersByTimeAsync(15_000)
    expect(server.sent('GET', LIST)).toHaveLength(2)

    answerDelete({ status: 204 })
    await eventually(() => expect(settings.alerts()).toEqual([REMOVED]))
    answerRead(listAnswer())
    await vi.advanceTimersByTimeAsync(100)

    expect([settings.spinners(), settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([0, false, true])

    listed = [distribution('dist-2', 'distributing'), distribution('dist-3')]
    server.on('GET', LIST, listAnswer)
    await vi.advanceTimersByTimeAsync(30_000)

    expect(server.sent('GET', LIST).length).toBeGreaterThan(2)
    expect([settings.shows('dist-1'), settings.shows('dist-2'), settings.shows('dist-3')]).toEqual([false, true, true])
  })

  it('stays, with the loader off and the error said, when the server refuses the delete', async () => {
    const settings = await openSettings()
    server.on('DELETE', ONE, () => {
      throw httpError(500)
    })

    await settings.remove('dist-1')

    await eventually(() => expect(settings.alerts()).toEqual([SYSTEM_ERROR]))
    await eventually(() => expect(settings.managed()).toEqual(['remote-dist-1', 'remote-dist-2']))
    expect([settings.spinners(), settings.bins()]).toEqual([0, 2])
    expect(server.sent('GET', LIST)).toHaveLength(1)
  })
})
