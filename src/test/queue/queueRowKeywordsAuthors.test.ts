import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'
// The names behind the ids of a row are requested in one call, some time after the last id was added.
const NAMES_READ = 5000
const SEARCH = /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/

const KEYWORDS = [{ id: 'keyword-bratislava', name: 'Bratislava' }]
const AUTHORS = [
  { id: 'author-jane', name: 'Jane Roe', identifier: 'TASR', flags: { reviewed: true } },
  { id: 'author-john', name: 'John Doe', identifier: '', flags: { reviewed: false } },
]

const editable = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, ...over })

const mountQueue = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}, queueId = QUEUE) => {
  const ui = await startUploadUi({ server, queues: { [queueId]: rows }, ...setup })
  server.on('GET', SEARCH, (_request, match) => {
    const query = new URLSearchParams(ui.asked[ui.asked.length - 1].split('?')[1])
    const ids = query.get('id')?.split(',')
    const searched = (query.get('text') ?? '').toLowerCase()
    const data = (match[1] === 'keyword' ? KEYWORDS : AUTHORS).filter((record) =>
      ids ? ids.includes(record.id) : record.name.toLowerCase().includes(searched)
    )

    return { status: 200, data: { data, totalCount: data.length } }
  })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
    queueId,
    massOperations: false,
  })
  const card = list.querySelector<HTMLElement>('.dam-upload-queue__item')!
  const field = (label: string) =>
    Array.from(card.querySelectorAll<HTMLElement>('.v-autocomplete')).find(
      (input) => input.querySelector('label')?.textContent?.trim() === label
    )!
  const search = async (label: string, text: string) => {
    const input = field(label).querySelector<HTMLInputElement>('input[type="text"]')!
    input.focus()
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)

    return input
  }
  const offered = () => {
    const items = Array.from(document.body.querySelectorAll<HTMLElement>('.v-overlay-container .v-list-item'))

    return {
      found: items.filter((item) => !item.querySelector('button')),
      add: items.find((item) => item.querySelector('button'))?.querySelector('button') ?? null,
    }
  }
  const chips = (label: string) =>
    Array.from(field(label).querySelectorAll('.v-chip')).map((chip) => chip.textContent?.trim())
  const chipIcons = (label: string) =>
    Array.from(field(label).querySelectorAll('.v-chip')).map((chip) => !!chip.querySelector('.mdi-new-box'))

  return { ...ui, rows: ui.rows[queueId], list, card, field, search, offered, chips, chipIcons }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the keyword input of a row', () => {
  it('searches the keywords of the ext system by what is typed, and writes the one picked into the row', async () => {
    const { rows, search, offered, chips, asked } = await mountQueue([editable(), editable({ assetId: 'asset-2' })])

    await search('Keywords', 'Brat')

    expect(asked.filter((url) => url.includes('text='))).toEqual([
      '/adm/v1/keyword/ext-system/1/search?limit=25&offset=0&text=Brat',
    ])
    expect(offered().found.map((item) => item.textContent?.trim())).toEqual(['Bratislava'])

    offered().found[0].click()
    await vi.advanceTimersByTimeAsync(1000)

    expect([rows[0].keywords, rows[1].keywords]).toEqual([['keyword-bratislava'], []])
    expect(chips('Keywords')).toEqual(['Bratislava'])
  })

  it('creates a keyword of a name confirmed with Enter, and writes it into the row', async () => {
    server.on('POST', /^\/adm\/v1\/keyword$/, (request) => ({
      status: 201,
      data: { ...JSON.parse(request.data as string), id: 'keyword-new' },
    }))
    const { rows, search, chips } = await mountQueue([editable({ keywords: ['keyword-bratislava'] })])

    const input = await search('Keywords', 'Kosice')
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    await vi.advanceTimersByTimeAsync(NAMES_READ)

    const created = server.sent('POST', /^\/adm\/v1\/keyword$/).map((request) => JSON.parse(request.data as string))
    expect(created).toEqual([expect.objectContaining({ name: 'Kosice', extSystem: 1 })])
    expect(rows[0].keywords).toEqual(['keyword-bratislava', 'keyword-new'])
    expect(chips('Keywords')).toEqual(['Bratislava', 'Kosice'])
  })

  it('offers no new keyword to a user who may not create keywords, and creates none on Enter', async () => {
    const { rows, search, offered } = await mountQueue([editable()], { grants: ['dam_asset_update'] })

    const input = await search('Keywords', 'Kosice')
    expect(offered().add).toBeNull()

    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)

    expect(server.sent('POST')).toEqual([])
    expect(rows[0].keywords).toEqual([])
  })

  it('offers a new keyword of the searched name to a user who may create keywords', async () => {
    const { search, offered } = await mountQueue([editable()])

    await search('Keywords', 'Kosice')

    expect(offered().add?.textContent?.trim()).toBe('Kosice')
  })
})

describe('a name the upload suggested as new', () => {
  it('is marked so on its chip in the row, for a keyword and for an author', async () => {
    const { store, chipIcons } = await mountQueue([
      editable({ keywords: ['keyword-bratislava'], authors: ['author-jane', 'author-john'] }),
    ])
    await vi.advanceTimersByTimeAsync(NAMES_READ)
    expect([chipIcons('Keywords'), chipIcons('Authors')]).toEqual([[false], [false, false]])

    store.queues[QUEUE].suggestions.newKeywordNames.add('Bratislava')
    store.queues[QUEUE].suggestions.newAuthorNames.add('John Doe')
    await nextTick()

    expect([chipIcons('Keywords'), chipIcons('Authors')]).toEqual([[true], [false, true]])
  })
})

describe('the author input of a row', () => {
  const addAuthor = (card: HTMLElement) => card.querySelector<HTMLButtonElement>('[data-cy="add-author"]')

  it('searches the authors of the ext system by what is typed, and writes the one picked into the row', async () => {
    const { rows, search, offered, chips, asked } = await mountQueue([editable()])

    await search('Authors', 'Jane')

    expect(asked.filter((url) => url.includes('text='))).toEqual([
      '/adm/v1/author/ext-system/1/search?limit=25&offset=0&text=Jane',
    ])
    offered().found[0].click()
    await vi.advanceTimersByTimeAsync(1000)

    expect(rows[0].authors).toEqual(['author-jane'])
    expect(chips('Authors')).toEqual(['Jane Roe (TASR)'])
  })

  it('has a button for a new author only for a user who may create authors', async () => {
    const allowed = await mountQueue([editable()])
    expect(addAuthor(allowed.card)).not.toBeNull()
    stopUploadUi()

    const refused = await mountQueue([editable()], { grants: ['dam_asset_update'] })
    expect(addAuthor(refused.card)).toBeNull()
  })

  it('has that button disabled while the metadata of the row cannot be edited', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploaded' })])
    expect(addAuthor(card)?.disabled).toBe(true)
    expect(addAuthor(card)?.closest('[style*="display: none"]')).toBeNull()
    expect(card.querySelectorAll('.v-autocomplete.v-input--disabled')).toHaveLength(2)

    rows[0].canEditMetadata = true
    await nextTick()
    await nextTick()

    expect(addAuthor(card)?.disabled).toBe(false)
  })

  // Two authors with one name: the server cannot tell which is meant and reports it in the asset metadata.
  const withConflicts = (assetId: string, authors: string[]) =>
    assetDetail(assetId, {
      authors,
      metadata: {
        customData: {},
        authorSuggestions: { 'J. Roe': ['author-john', 'author-jane'], 'Somebody Else': ['author-jane'] },
        keywordSuggestions: {},
      },
    })
  const conflicts = (card: HTMLElement) =>
    Array.from(card.querySelectorAll<HTMLElement>('.v-chip')).filter(
      (chip) => chip.querySelector('.v-chip__close') && !chip.closest('.v-autocomplete')
    )

  it('offers the author conflicts of an upload under it, by name, and adds the one pressed to the authors of the row', async () => {
    const { rows, card, chips } = await mountQueue([
      queueRow({ status: 'uploaded', error: { hasError: true, message: 'warned', assetFileFailReason: 'none' } }),
    ])
    server.asset(withConflicts('asset-1', ['author-jane']))
    buttonsNamed(card, 'Refresh')[0].click()
    await vi.advanceTimersByTimeAsync(NAMES_READ)
    expect(rows[0].authorConflicts).toEqual(['author-john', 'author-jane'])

    expect(card.textContent).toContain('Author conflicts')
    expect(conflicts(card).map((chip) => chip.textContent?.trim())).toEqual(['John Doe'])

    conflicts(card)[0].querySelector<HTMLElement>('.v-chip__close')?.click()
    await vi.advanceTimersByTimeAsync(NAMES_READ)

    expect(rows[0].authors).toEqual(['author-jane', 'author-john'])
    expect(chips('Authors')).toEqual(['Jane Roe (TASR)', 'John Doe'])

    expect(conflicts(card)).toEqual([])
    expect(card.textContent).not.toContain('Author conflicts')
    expect(rows[0].authorConflicts).toEqual(['author-john', 'author-jane'])
  })

  // The batch load of assets picked for mass edit also asks for
  // the names of their author conflicts, as the detail does.
  it('offers the author conflicts of an asset picked for mass edit by name', async () => {
    const asset = withConflicts('asset-1', [])
    server.asset(asset)
    const { store, list, asked } = await mountQueue([], {}, 'edit')

    await store.addByAssets('edit', [asset as never])
    await vi.advanceTimersByTimeAsync(NAMES_READ)
    await vi.advanceTimersByTimeAsync(NAMES_READ)

    const card = list.querySelector<HTMLElement>('.dam-upload-queue__item')!
    expect(store.getQueueItems('edit')[0].authorConflicts).toEqual(['author-john', 'author-jane'])
    expect(card.textContent).toContain('Author conflicts')
    expect(
      conflicts(card).map((chip) => [chip.textContent?.trim(), !!chip.querySelector('.v-progress-circular')])
    ).toEqual([
      ['John Doe', false],
      ['Jane Roe (TASR)', false],
    ])
    expect(asked.filter((url) => url.startsWith('/adm/v1/author/'))).toHaveLength(1)
  })

  it('offers no author conflicts while the metadata of the row cannot be edited', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', authorConflicts: ['author-john'] })])
    await vi.advanceTimersByTimeAsync(NAMES_READ)

    expect(card.textContent).not.toContain('Author conflicts')
  })
})
