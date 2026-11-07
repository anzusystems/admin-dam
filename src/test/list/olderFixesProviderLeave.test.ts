import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The licence dialog and the "Create empty asset" dialog must stay open while
 * their request is on its way, because they hold back a second confirm.
 * Pages of two external providers are one router page with a different provider in the address.
 * Going from one provider to the other is not a page leave for
 * the router, but it redrew the page and removed the dialog.
 * Another query of the same provider redraws nothing.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-\d\/search$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/
const OTHER_LICENCE = /^\/adm\/v1\/asset-licence\/2$/
const CURRENT_USER = /^\/adm\/users\/current$/

const CREATED = 'Record was created'
const CHANGE_LICENCE = 'Switch Media Library ext system and asset licence'

const FIRST = '/external-providers/provider-1'
const SECOND = '/external-providers/provider-2'

const settled = () => vi.advanceTimersByTimeAsync(100)

const dialogSaying = (text: string) =>
  Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find((found) =>
    found.textContent?.includes(text)
  ) ?? null

const openProvider = async (address: typeof FIRST | typeof SECOND) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_assetExternalProvider_access'],
  })
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { 'provider-1': { title: 'Provider 1' }, 'provider-2': { title: 'Provider 2' } }
  config.damPrvConfig = {
    ...config.damPrvConfig,
    settings: { ...config.damPrvConfig.settings, allowSelectExtSystem: true, allowSelectLicenceId: true },
  }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    allowedAssetExternalProviders: ['provider-1', 'provider-2'],
    userToExtSystemsDto: [{ id: 1, name: 'Ext system' }],
    assetLicencesDto: [
      { id: 1, name: 'Licence', extSystem: 1 },
      { id: 2, name: 'Other licence', extSystem: 1 },
    ],
  } as never)
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: { render: () => null } })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push(FIRST)
  const Pages = defineComponent({
    setup: () => {
      const route = useRoute()

      return () => h(RouterView, { key: route.path })
    },
  })
  const page = await ui.mount(async () => ({ default: Pages }))
  const listed = () => expect(page.textContent).toContain('No matching assets found')
  await eventually(listed)
  if (address === SECOND) {
    void ui.router.push(SECOND)
    await settled()
    await eventually(() => expect(ui.router.currentRoute.value.path).toBe(SECOND))
    await eventually(listed)
  }
  const item = (dataCy: string) =>
    eventually(() => {
      const found = document.body.querySelector<HTMLElement>(`[data-cy="${dataCy}"]`)
      expect(found).not.toBeNull()

      return found!
    })

  return {
    ...ui,
    at: () => ui.router.currentRoute.value.fullPath,
    create: async () => {
      page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
      ;(await item('button-main-empty-asset')).click()
      const panel = await item('create-panel')
      panel.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
      await eventually(() => expect(server.sent('POST', CREATE)).toHaveLength(1))

      return panel
    },
    changeLicence: async () => {
      page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
      ;(await item('button-switch-licence')).click()
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
      await eventually(() => expect(server.sent('GET', OTHER_LICENCE)).toHaveLength(1))

      return dialog
    },
    back: async () => {
      ui.router.back()
      for (let turn = 0; turn < 50; turn++) await Promise.resolve()
      window.dispatchEvent(new PopStateEvent('popstate', { state: { replaced: true } }))
      await settled()
    },
  }
}

const hold = (method: 'GET' | 'POST', pattern: RegExp, answered: () => FakeDamAnswer) => {
  let answer: () => void = () => undefined
  server.on(method, pattern, () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve(answered()))))

  return async () => {
    answer()
    await settled()
  }
}

beforeEach(() => {
  server = createFakeDam()
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  server.on('PATCH', CURRENT_USER, () => ({ status: 200, data: { id: 7 } }))
  vi.stubGlobal('open', () => ({
    opener: window,
    closed: false,
    close: () => undefined,
    location: { href: 'about:blank', replace: () => undefined },
  }))
  vi.spyOn(window.location, 'reload').mockImplementation(() => undefined)
  window.history.replaceState(null, '', FIRST)
})

afterEach(() => {
  vi.restoreAllMocks()
  stopUploadUi()
})

describe('a dialog of the menu of the page of a provider while its request is on its way', () => {
  it('"Create empty asset": keeps the page when the page of another provider is gone to', async () => {
    const answer = hold('POST', CREATE, () => ({
      status: 201,
      data: { ...assetDetail('asset-new'), keywords: [], authors: [] },
    }))
    const provider = await openProvider(FIRST)
    const dialog = await provider.create()

    void provider.router.push(SECOND)
    await settled()

    expect([provider.at(), dialog.isConnected]).toEqual([FIRST, true])
    await answer()
    expect(provider.alerts()).toEqual([CREATED])
    void provider.router.push(SECOND)
    await settled()
    expect(provider.at()).toBe(SECOND)
  })

  it('the change of the licence: keeps the page when the back button leads to the page of the provider before', async () => {
    const answer = hold('GET', OTHER_LICENCE, () => ({
      status: 200,
      data: { id: 2, name: 'Other licence', extSystem: 1 },
    }))
    const provider = await openProvider(SECOND)
    const dialog = await provider.changeLicence()

    await provider.back()

    expect([provider.at(), dialog.isConnected]).toEqual([SECOND, true])
    await answer()
    await eventually(() => expect(window.location.reload).toHaveBeenCalledTimes(1))
  })

  it('"Create empty asset": lets another query of the same provider through', async () => {
    hold('POST', CREATE, () => ({ status: 201, data: { ...assetDetail('asset-new'), keywords: [], authors: [] } }))
    const provider = await openProvider(FIRST)
    const dialog = await provider.create()

    void provider.router.push(FIRST + '?view=other')
    await settled()

    expect([provider.at(), dialog.isConnected]).toEqual([FIRST + '?view=other', true])
  })
})
