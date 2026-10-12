import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* Deleting a distribution in the advanced settings of the distributions tab. The real tab with its real settings
 * and the list editor of the library, the application around them as it starts; the server is a fake. The tab and
 * its settings draw the same list under one loader: the delete turns it on, and after a delete that went through it
 * stays on until the tab has read the list again. The tab reads it when the settings tell it of the delete. */

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

/** A distribution as the list of an asset answers it; the tab and its settings both show its remote id. */
const distribution = (id: string) => ({
  id,
  assetId: 'asset-1',
  assetFileId: 'file-1',
  extId: 'remote-' + id,
  distributionService: SERVICE,
  status: 'distributed',
  failReason: 'none',
  blockedBy: [],
  publishAt: null,
  customData: {},
  distributionData: {},
  _resourceName: 'distribution',
})

/** What the server lists for the asset; a case changes it as a distribution is deleted. */
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
  // The services of the account: a distribution to one of them may be redistributed and managed.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({ ...currentUser.value, allowedDistributionServices: [SERVICE] } as never)

  const tab = await ui.mount(
    () =>
      import('@/domains/coreDam/asset/components/detail/components/distribution/AssetDetailSidebarDistribution.vue'),
    { isActive: true, assetType: 'video', assetId: 'asset-1', assetMainFileStatus: 'processed' }
  )
  /** The rows of the settings, each by the remote id of its distribution. */
  const managed = () =>
    Array.from(tab.querySelectorAll('.a-le-row')).map((row) => row.textContent?.match(/remote-[\w-]+/)?.[0])
  await eventually(() => expect(tab.textContent).toContain('remote-dist-1'))
  buttonsNamed(tab, SHOW_SETTINGS)[0].click()
  await eventually(() => expect(managed()).toEqual(listed.map((item) => item.extId)))

  return {
    ...ui,
    managed,
    /** Whether the distribution shows anywhere in the tab: in its list or in its settings. */
    shows: (id: string) => tab.textContent?.includes('remote-' + id) ?? false,
    spinners: () => tab.querySelectorAll('.v-progress-circular').length,
    /** The buttons a distribution can be deleted by; none while the settings are behind their loader. */
    bins: () => tab.querySelectorAll('.a-le-action--delete').length,
    hide: () => buttonsNamed(tab, HIDE_SETTINGS)[0].click(),
    /** The bin of the row, and "Delete" of the question it asks. */
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
    // The read is on its way: neither the list of the tab nor the settings draw anything but their loader.
    expect([settings.spinners(), settings.managed(), settings.bins()]).toEqual([2, [], 0])
    expect([settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([false, false])

    listed = [distribution('dist-2')]
    answer(listAnswer())

    await eventually(() => expect(settings.managed()).toEqual(['remote-dist-2']))
    expect([settings.spinners(), settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([0, false, true])
    expect(server.sent('DELETE', ONE)).toHaveLength(1)
  })

  // The settings are gone when the delete is answered: nobody hears of it, so nobody reads the list again.
  it('leaves no loader on when the settings were hidden while the delete was on its way', async () => {
    const settings = await openSettings()
    let answer: (deleted: FakeDamAnswer) => void = () => undefined
    server.on('DELETE', ONE, () => new Promise<FakeDamAnswer>((resolve) => (answer = resolve)))
    await settings.remove('dist-1')
    await eventually(() => expect(server.sent('DELETE', ONE)).toHaveLength(1))

    settings.hide()
    // The list of the tab is still behind its loader; the settings and theirs are gone.
    await eventually(() => expect(settings.spinners()).toBe(1))
    answer({ status: 204 })

    await eventually(() => expect(settings.alerts()).toEqual([REMOVED]))
    expect(settings.spinners()).toBe(0)
    // A known limit: the list is the one read before the delete until something reads it again.
    expect([server.sent('GET', LIST).length, settings.shows('dist-1')]).toEqual([1, true])
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
    // Nothing was deleted, so nothing is read again.
    expect(server.sent('GET', LIST)).toHaveLength(1)
  })
})
