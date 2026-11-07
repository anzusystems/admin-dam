import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/

const EDIT = 'Edit more'
const NO_TAB = 'The browser did not open a new tab. Allow pop-up windows for this site and try again.'

const PROVIDED = '/external-providers/' + PROVIDER
const UPLOADED = 'asset-9'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'image', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const browserOpensTabs = (gives: boolean) => {
  const open = vi.fn<(...asked: unknown[]) => { opener: unknown } | null>(() =>
    gives ? { opener: window as unknown } : null
  )
  vi.stubGlobal('open', open)

  return { asked: () => open.mock.calls }
}

const openQueue = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_assetExternalProvider_access'],
    customForm: { image: [customField('title')] },
    queues: { global: uploaded },
  })
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    allowedAssetExternalProviders: [PROVIDER],
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: '/assets', name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push(PROVIDED)
  const page = await ui.mount(async () => ({ default: RouterView }))
  await eventually(() => expect(page.textContent).toContain('No matching assets found'))
  document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
  const edit = await eventually(() => {
    const queue = document.body.querySelector<HTMLElement>('.overlay--sidebar')
    const button = queue ? buttonsNamed(queue, EDIT)[0] : undefined
    expect(button?.disabled).toBe(false)

    return button!
  })

  return { ...ui, edit, at: () => ui.router.currentRoute.value.path }
}

beforeEach(() => {
  server = createFakeDam()
  server.asset(onServer(UPLOADED, { mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }) }))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', PROVIDED)
})

afterEach(() => {
  stopUploadUi()
})

describe('the edit of a row of the upload queue on the page of an external provider', () => {
  it('opens one tab for a double click', async () => {
    const queue = await openQueue()
    const tabs = browserOpensTabs(true)

    queue.edit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    queue.edit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 2 }))
    queue.edit.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, detail: 2 }))
    await settled()

    expect(tabs.asked()).toEqual([['/assets/' + UPLOADED, '_blank']])
    expect([queue.at(), queue.alerts()]).toEqual([PROVIDED, []])
  })

  it('says so when the browser gives no tab, and the next press tries again', async () => {
    const queue = await openQueue()
    const tabs = browserOpensTabs(false)

    queue.edit.click()
    await settled()

    expect([tabs.asked().length, queue.alerts(), queue.at()]).toEqual([1, [NO_TAB], PROVIDED])

    const again = browserOpensTabs(true)
    queue.edit.click()
    await settled()

    expect([again.asked(), queue.alerts()]).toEqual([[['/assets/' + UPLOADED, '_blank']], [NO_TAB]])
  })
})
