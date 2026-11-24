import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A licence has one default source, picked from the sources of the current ext system.
 * Its field offers the sources as it opens, and "+" creates a source for a user who may.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/author\/ext-system\/1\/search$/
const AUTHOR = /^\/adm\/v1\/author$/

const SOURCES = [
  { id: 'source-1', name: 'TASR', identifier: '', flags: { reviewed: true, source: true, hiddenInCredit: false } },
]

const mountForm = async (grants: string[]) => {
  const ui = await startUploadUi({ server, grants: ['dam_assetLicence_update', ...grants] })
  server.on('GET', SEARCH, () => {
    const query = new URLSearchParams(ui.asked[ui.asked.length - 1]!.split('?')[1])
    const ids = query.get('id')?.split(',')
    const data = SOURCES.filter((source) => !ids || ids.includes(source.id))

    return { status: 200, data: { data, totalCount: data.length } }
  })
  const form = await ui.mount(() => import('@/domains/coreDam/assetLicence/components/AssetLicenceEditForm.vue'))
  const { useAssetLicenceOneStore } = await import('@/domains/coreDam/assetLicence/store/assetLicenceStore')
  const store = useAssetLicenceOneStore()
  const field = () => form.querySelector<HTMLElement>('[data-cy="asset-licence-default-source"]')!
  const open = async () => {
    const input = field().querySelector<HTMLInputElement>('input[type="text"]')!
    input.focus()
    input.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(1000)
  }
  const offered = () =>
    Array.from(document.body.querySelectorAll<HTMLElement>('.v-overlay-container .v-list-item')).filter(
      (item) => !item.querySelector('button')
    )

  return { ...ui, form, store, field, open, offered }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [] } }))
  // The users field of the internal rule beside it.
  server.on('GET', /^\/adm\/v1\/user/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the default source of a licence', () => {
  it('offers the sources, not merged ones, as soon as its field opens, and writes the one picked as a single id', async () => {
    const { store, open, offered, asked } = await mountForm([])

    await open()

    const searches = asked.filter((url) => SEARCH.test(url.split('?')[0]!) && !url.includes('id='))
    expect(searches.length).toBeGreaterThan(0)
    expect(searches.every((url) => url.includes('source=true') && url.includes('canBeCurrentAuthor=true'))).toBe(true)
    await eventually(() => expect(offered()).toHaveLength(1))
    offered()[0]!.click()
    await nextTick()

    expect(store.assetLicence.defaultSource).toBe('source-1')
  })

  it('is emptied to null when cleared', async () => {
    const { store, field } = await mountForm([])
    store.assetLicence.defaultSource = 'source-1'
    await vi.advanceTimersByTimeAsync(1000)

    field().querySelector<HTMLElement>('.v-field__clearable .v-icon')!.click()
    await nextTick()

    expect(store.assetLicence.defaultSource).toBeNull()
  })

  it('creates a source with "+" and takes it, for a user who may create sources', async () => {
    server.on('POST', AUTHOR, (request) => ({
      status: 201,
      data: { ...JSON.parse(request.data as string), id: 'source-new', currentAuthors: [], childAuthors: [] },
    }))
    const { store, field } = await mountForm(['dam_source_create'])

    field().parentElement!.querySelector<HTMLButtonElement>('[data-cy="add-author"]')!.click()
    await eventually(() => expect(document.body.querySelector('.v-dialog [data-cy="create-panel"]')).not.toBeNull())
    const name = document.body.querySelector<HTMLInputElement>('.v-dialog [data-cy="author-name"] input')!
    name.value = 'SITA'
    name.dispatchEvent(new Event('input'))
    await nextTick()
    document.body.querySelector<HTMLButtonElement>('.v-dialog [data-cy="button-confirm"]')!.click()

    await eventually(() => expect(store.assetLicence.defaultSource).toBe('source-new'))
    expect(JSON.parse(server.sent('POST', AUTHOR)[0]!.data as string)).toEqual(
      expect.objectContaining({ name: 'SITA', flags: expect.objectContaining({ source: true }) })
    )
  })

  it('has no "+" for a user who may not create sources', async () => {
    const { field } = await mountForm(['dam_author_create'])

    expect(field().parentElement!.querySelector('[data-cy="add-author"]')).toBeNull()
  })
})
