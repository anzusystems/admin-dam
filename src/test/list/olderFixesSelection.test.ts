import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The mass edit went back into its strip when left by the browser back button onto
 * an entry where ADAM was loaded or reloaded. Vuetify lets that pass an open dialog.
 * The next list then emptied it. A page that is not a list kept it until a list came.
 * "Save and finish" empties it once the server answers, only on its
 * own page. Another query of the same list was taken for another page.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

const LIST = '/assets'
const ELSEWHERE = '/settings'
const UPDATED = 'Record was updated'
const SAVE_AND_FINISH = 'Save and finish'

const TITLES = ['asset-1', 'asset-2', 'asset-3']

const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'image', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const FULL_SCREEN = '.v-dialog--fullscreen'
const fullScreen = () => document.body.querySelector<HTMLElement>(FULL_SCREEN)

const holdBulkSave = () => {
  let answer: () => Promise<unknown> = async () => undefined
  server.on(
    'PATCH',
    BULK,
    (request) =>
      new Promise<FakeDamAnswer>((resolve) => {
        answer = () => {
          resolve({ status: 200, data: JSON.parse(request.data as string) })

          return settled()
        }
      })
  )

  return () => answer()
}

const massEdit = async () => {
  const { useAssetFooterSelectedView } = await import('@/domains/coreDam/asset/composables/assetFooterSelected')
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return [useAssetFooterSelectedView().footerViewSelected.value, useUploadQueuesStore().getQueueTotalCount('edit')]
}

const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update'],
    customForm: { image: [customField('title')] },
  })
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: ELSEWHERE, component: { render: () => h('div', { class: 'elsewhere' }) } })
  await ui.router.push(ELSEWHERE)
  const Pages = defineComponent({
    setup: () => {
      const route = useRoute()

      return () => h(RouterView, { key: route.path })
    },
  })
  const page = await ui.mount(async () => ({ default: Pages }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  const titles = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  void ui.router.push(LIST)
  await settled()
  await eventually(() => expect(titles()).toEqual(TITLES))
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

  return {
    ...ui,
    page,
    queue,
    at: () => ui.router.currentRoute.value.fullPath,
    picked: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--selected')),
    openMassEdit: async (index: number) => {
      tiles()[index].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
      await settled()
      const open = await eventually(() => {
        const strip = page.querySelector<HTMLElement>('.v-app-bar .asset-footer__selected')
        const found = strip ? buttonsNamed(strip, 'Edit')[0] : undefined
        expect(found).toBeTruthy()

        return found!
      })
      open.click()
      await eventually(() => expect(queue()).not.toBeNull())
    },
    saveAndFinish: async () => {
      const button = await eventually(() => {
        const found = buttonsNamed(queue()!, SAVE_AND_FINISH)[0]
        expect(found?.disabled).toBe(false)

        return found
      })
      button.click()
      await settled()
      expect(server.sent('PATCH', BULK)).toHaveLength(1)
    },
    backToALoadedEntry: async () => {
      ui.router.back()
      for (let turn = 0; turn < 50; turn++) await Promise.resolve()
      window.dispatchEvent(new PopStateEvent('popstate', { state: { replaced: true } }))
      await settled()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  for (const id of TITLES) server.asset(onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: TITLES.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', ELSEWHERE)
})

afterEach(() => {
  stopUploadUi()
})

describe('the mass edit of the list of DAM', () => {
  it('is emptied as the list is left by the back button onto a page that is no list', async () => {
    const list = await openList()
    await list.openMassEdit(2)
    expect(await massEdit()).toEqual(['full', 1])

    await list.backToALoadedEntry()

    expect([list.at(), fullScreen(), list.page.querySelector('.elsewhere') !== null]).toEqual([ELSEWHERE, null, true])
    expect(await massEdit()).toEqual(['hidden', 0])
  })

  it('saved and finished: its answer after another query of the same list empties it and puts it away', async () => {
    const answer = holdBulkSave()
    const list = await openList()
    await list.openMassEdit(2)
    await list.saveAndFinish()

    void list.router.push(LIST + '?view=other')
    await settled()
    expect([list.at(), fullScreen() !== null]).toEqual([LIST + '?view=other', true])

    await answer()

    expect(list.alerts()).toEqual([UPDATED])
    expect([fullScreen(), list.picked(), await massEdit()]).toEqual([null, [false, false, false], ['hidden', 0]])
  })
})
