import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  forbiddenOperationError,
  httpError,
  validationError,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Changes of an asset file (route, slot, main file) are refused by the server for a reason:
 * the user may not (403), or what was sent is invalid (422, with the field or operation).
 * They used to be sent by hand-made promises that passed the raw
 * axios error to the alerts, so every refusal said "System error".
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const FORBIDDEN = "Access denied, you don't have correct rights for this action"
const SLUG_NOT_UNIQUE = 'Please, fix these errors\nSlug: Field must be unique.'
const OPERATION_REFUSED = 'An unknown error occurred. Contact the administrator if necessary.'

const DOCUMENT = '11111111-2222-4333-8444-555555555555'
const DOCUMENT_FILE = 'aaaaaaaa-2222-4333-8444-555555555555'
const IMAGE = '22222222-2222-4333-8444-555555555555'
const FIRST = 'bbbbbbbb-2222-4333-8444-555555555555'
const SECOND = 'cccccccc-2222-4333-8444-555555555555'

const settled = () => vi.advanceTimersByTimeAsync(100)

const documentFile = () => ({
  ...assetFile(DOCUMENT_FILE, 'processed', { asset: DOCUMENT }),
  _resourceName: 'documentFile',
  mainRoute: null,
})
const imageFile = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: IMAGE }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  mainRoute: null,
})

const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const menuItem = (name: string) =>
  eventually(() => {
    const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
      (item) => item.textContent?.trim() === name
    )
    expect(found).toBeTruthy()

    return found!
  })

const openPage = async (assetId: string) => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_document_update'],
    extSystem: { image: { slots: ['default', 'extra'] }, document: { slots: ['default'] } },
    customForm: { image: [customField('title')], document: [customField('title')] },
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
  const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push('/assets/' + assetId)
  const page = await ui.mount(async () => ({ default: RouterView }))
  await eventually(() => expect(page.querySelector('.sidebar-info__content textarea')).toBeTruthy())

  return { ...ui, page }
}

beforeEach(() => {
  server = createFakeDam()
  server.asset({
    ...assetDetail(DOCUMENT, {
      attributes: { assetType: 'document', assetStatus: 'with_file' },
      licence: 1,
      mainFile: documentFile(),
    }),
    keywords: [],
    authors: [],
  })
  server.asset({
    ...assetDetail(IMAGE, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      licence: 1,
      mainFile: imageFile(FIRST),
    }),
    keywords: [],
    authors: [],
  })
  server.fileBy('document', DOCUMENT_FILE, documentFile)
  for (const fileId of [FIRST, SECOND]) server.fileBy('image', fileId, () => imageFile(fileId))
  server.slotsBy(IMAGE, () => ({
    data: [
      { id: 'slot-default', slotName: 'default', default: true, main: true, assetFile: imageFile(FIRST) },
      { id: 'slot-extra', slotName: 'extra', default: false, main: false, assetFile: imageFile(SECOND) },
    ],
    totalCount: 2,
  }))
  const empty = () => ({ status: 200, data: { data: [] } })
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
})

afterEach(() => {
  stopUploadUi()
})

describe('a change of a file refused by the server', () => {
  it.each<[string, () => Error, string]>([
    ['403', () => httpError(403), FORBIDDEN],
    ['422 of its slug', () => validationError({ slug: ['error_field_not_unique'] }), SLUG_NOT_UNIQUE],
  ])('says why: "Make public" of a document answered %s', async (_answered, refusal, said) => {
    server.on('PATCH', /^\/adm\/v1\/document\/[^/]+\/make-public$/, () => {
      throw refusal()
    })
    const { page, alerts } = await openPage(DOCUMENT)
    page.querySelector('.sidebar-info__content .mdi-dots-vertical')!.closest('button')!.click()
    ;(await menuItem('Make public')).click()
    const dialog = await eventually(() => {
      const open = Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find(
        (opened) => buttonsNamed(opened, 'Confirm').length === 1
      )
      expect(open).toBeTruthy()

      return open!
    })

    buttonsNamed(dialog, 'Confirm')[0].click()
    await settled()

    expect(alerts()).toEqual([said])
    expect(alerts()).not.toContain(SYSTEM_ERROR)
  })

  it.each<[string, () => Error, string]>([
    ['403', () => httpError(403), FORBIDDEN],
    ['422 of the operation', () => forbiddenOperationError('slot_main_file_change'), OPERATION_REFUSED],
  ])('says why: "Make main file" of a slot answered %s', async (_answered, refusal, said) => {
    server.on('PATCH', /^\/adm\/v1\/image\/[^/]+\/asset\/[^/]+\/main$/, () => {
      throw refusal()
    })
    const { page, alerts } = await openPage(IMAGE)
    page.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
    const extra = await eventually(() => {
      const row = Array.from(page.querySelectorAll<HTMLElement>('.sidebar-info__content .pa-4.pb-8')).find((found) =>
        found.querySelector('.font-weight-bold')?.textContent?.trim().startsWith('extra')
      )
      expect(row).toBeTruthy()

      return row!
    })
    extra.querySelector('[data-cy="button-slot-actions"]')!.closest('button')!.click()
    ;(await menuItem('Make main file')).click()
    await settled()

    expect(alerts()).toEqual([said])
  })
})
