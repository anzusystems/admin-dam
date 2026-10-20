import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The distributions tab of a detail, closed and opened again, or its advanced settings hidden, while a delete or a
 * save of its settings is on its way. The tab and its settings draw one list under one loader. The real tab with its
 * real settings and dialogs, the application around them as it starts; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SERVICE = 'custom_main'
const LIST = /^\/adm\/v1\/distribution\/asset\/asset-1$/
const ONE = /^\/adm\/v1\/distribution\/[^/]+$/
const SAVE = /^\/adm\/v1\/distribution$/

const SHOW_SETTINGS = 'Show advanced distribution management'
const HIDE_SETTINGS = 'Hide advanced distribution management'
const DELETE = 'Delete'
const CONFIRM = 'Confirm'
const REMOVED = 'Record was removed'
const UPDATED = 'Record was updated'
const NOTHING_TO_SHOW = 'Nothing to show'

/** A distribution as the list of an asset answers it; the tab and its settings both show its remote id. */
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

/** What the server lists for the asset; a case changes it as the distributions change. */
let listed: ReturnType<typeof distribution>[] = []
const listAnswer = (): FakeDamAnswer => ({ status: 200, data: { data: structuredClone(listed) } })

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The tab with its settings shown, in a detail that can close it and open it again. */
const openSettings = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_distribution_access', 'dam_distribution_update', 'dam_distribution_delete'],
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
  const asset = assetDetail('asset-1', { attributes: { assetType: 'video', assetStatus: 'with_file' } })
  server.asset({ ...asset, keywords: [], authors: [] })
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  useAssetDetailStore().setAsset({ ...asset, keywords: [], authors: [] } as never)

  const Tab = (
    await import('@/domains/coreDam/asset/components/detail/components/distribution/AssetDetailSidebarDistribution.vue')
  ).default
  // As the detail draws its tabs: only the one open.
  const open = ref(true)
  const Detail = defineComponent({
    setup: () => () =>
      open.value
        ? h(Tab, { isActive: true, assetType: 'video', assetId: 'asset-1', assetMainFileStatus: 'processed' })
        : null,
  })
  const detail = await ui.mount(async () => ({ default: Detail }))
  /** The rows of the settings, each by the remote id of its distribution. */
  const managed = () =>
    Array.from(detail.querySelectorAll('.a-le-row')).map((row) => row.textContent?.match(/remote-[\w-]+/)?.[0])
  await eventually(() => expect(detail.textContent).toContain('remote-dist-1'))
  buttonsNamed(detail, SHOW_SETTINGS)[0].click()
  await eventually(() => expect(managed()).toEqual(listed.map((item) => item.extId)))

  return {
    ...ui,
    managed,
    /** Whether the distribution shows anywhere in the tab: in its list or in its settings. */
    shows: (id: string) => detail.textContent?.includes('remote-' + id) ?? false,
    /** Whether the tab says that. */
    says: (text: string) => detail.textContent?.includes(text) ?? false,
    spinners: () => detail.querySelectorAll('.v-progress-circular').length,
    hide: () => buttonsNamed(detail, HIDE_SETTINGS)[0].click(),
    /** Another tab of the detail picked, and this one again: it reads its list anew. */
    reopen: async () => {
      open.value = false
      await settled()
      open.value = true
      await settled()
    },
    /** The bin of the row, and "Delete" of the question it asks. */
    remove: async (id: string) => {
      const row = Array.from(detail.querySelectorAll('.a-le-row')).find((found) =>
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
    /** The pencil of the first row of the settings; answers "Confirm" of its dialog. */
    edit: async () => {
      detail.querySelector<HTMLButtonElement>('.a-le-row .a-le-action--edit')!.click()

      return eventually(() => {
        const button = dialogButton(CONFIRM)
        expect(button).not.toBeNull()

        return button!
      })
    },
  }
}

/** Every delete of a distribution is held from now on, until answered. */
const holdDeletes = () => {
  let answer: () => void = () => undefined
  server.on('DELETE', ONE, () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve({ status: 204 }))))

  return () => {
    answer()

    return settled()
  }
}

/** Every read of the list is held from now on, until answered with what the server lists then. */
const holdReads = () => {
  const answers: Array<() => void> = []
  server.on('GET', LIST, () => new Promise<FakeDamAnswer>((resolve) => answers.push(() => resolve(listAnswer()))))

  return () => {
    answers.shift()?.()

    return settled()
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

describe('the distributions tab opened again while a delete in its settings is on its way', () => {
  // The delete answered with nobody to read the list, and lowered the loader under the read of the tab opened again.
  it('spins until its own read is answered, and does not say there is nothing to show meanwhile', async () => {
    const settings = await openSettings()
    const answerDelete = holdDeletes()
    await settings.remove('dist-1')
    await eventually(() => expect(server.sent('DELETE', ONE)).toHaveLength(1))
    const answerRead = holdReads()
    await settings.reopen()
    expect(server.sent('GET', LIST)).toHaveLength(2)

    listed = [distribution('dist-2')]
    await answerDelete()

    expect(settings.alerts()).toEqual([REMOVED])
    expect([settings.spinners(), settings.says(NOTHING_TO_SHOW)]).toEqual([1, false])

    await answerRead()

    expect([settings.spinners(), settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([0, false, true])
  })

  // Its read was sent before the server deleted the distribution, and is answered with it.
  it('does not take back the distribution deleted, which the read sent before the delete was answered brings', async () => {
    const settings = await openSettings()
    const answerDelete = holdDeletes()
    await settings.remove('dist-1')
    await eventually(() => expect(server.sent('DELETE', ONE)).toHaveLength(1))
    const answerRead = holdReads()
    await settings.reopen()

    await answerDelete()
    await answerRead()

    expect(settings.alerts()).toEqual([REMOVED])
    expect([settings.spinners(), settings.shows('dist-1'), settings.shows('dist-2')]).toEqual([0, false, true])
  })
})

describe('the advanced settings hidden while a record of a distribution is saved', () => {
  // The dialog of the record went with the settings, and with it the event that read the list anew.
  it('leave the tab to read its list anew once the record is saved', async () => {
    const settings = await openSettings()
    let answer: () => void = () => undefined
    server.on(
      'PATCH',
      SAVE,
      (request) =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 200, data: JSON.parse(request.data as string) })
        })
    )
    ;(await settings.edit()).click()
    await eventually(() => expect(server.sent('PATCH', SAVE)).toHaveLength(1))

    settings.hide()
    await settled()
    expect(dialogButton(CONFIRM)).toBeNull()
    listed = [{ ...distribution('dist-1'), extId: 'remote-dist-1-saved' }, distribution('dist-2')]
    answer()
    await settled()

    expect(settings.alerts()).toEqual([UPDATED])
    await eventually(() => expect(settings.shows('dist-1-saved')).toBe(true))
    expect(server.sent('GET', LIST)).toHaveLength(2)
  })
  /* Closed and opened again while the record is saved: the tab read its list as it opened, before the save was
   * answered, and the dialog that saved told the tab it was drawn in, which was gone. */
  it('leave the tab opened again meanwhile to read its list anew once the record is saved', async () => {
    const settings = await openSettings()
    let answer: () => void = () => undefined
    server.on(
      'PATCH',
      SAVE,
      (request) =>
        new Promise<FakeDamAnswer>((resolve) => {
          answer = () => resolve({ status: 200, data: JSON.parse(request.data as string) })
        })
    )
    ;(await settings.edit()).click()
    await eventually(() => expect(server.sent('PATCH', SAVE)).toHaveLength(1))

    await settings.reopen()
    await eventually(() => expect(server.sent('GET', LIST)).toHaveLength(2))
    expect(settings.shows('dist-1')).toBe(true)
    listed = [{ ...distribution('dist-1'), extId: 'remote-dist-1-saved' }, distribution('dist-2')]
    answer()
    await settled()

    expect(settings.alerts()).toEqual([UPDATED])
    await eventually(() => expect(settings.shows('dist-1-saved')).toBe(true))
    expect(server.sent('GET', LIST)).toHaveLength(3)
  })
})
