import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/* The keyword and the author input of a row of the editable queue: what a search and a pick, a new name confirmed
 * with Enter, and a pressed author conflict write into the row - and what of that a user without the grants is
 * offered. The real inputs in the real row and list over the real store and name caches; the server is a fake that
 * knows a keyword and two authors. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'
// The names behind the ids of a row are asked for in one request, some time after the last id was added.
const NAMES_READ = 5000
const SEARCH = /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/

const KEYWORDS = [{ id: 'keyword-bratislava', name: 'Bratislava' }]
const AUTHORS = [
  { id: 'author-jane', name: 'Jane Roe', identifier: 'TASR', flags: { reviewed: true } },
  { id: 'author-john', name: 'John Doe', identifier: '', flags: { reviewed: false } },
]

const editable = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, ...over })

/** Mounts the editable list of the queue over the rows and answers the two inputs of its first row. */
const mountQueue = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}, queueId = QUEUE) => {
  const ui = await startUploadUi({ server, queues: { [queueId]: rows }, ...setup })
  // The server finds a keyword or an author by its ids or by a text in its name.
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
  /** What the open menu of an input offers: the records the server found, and the offer to add the searched name. */
  const offered = () => {
    const items = Array.from(document.body.querySelectorAll<HTMLElement>('.v-overlay-container .v-list-item'))

    return {
      found: items.filter((item) => !item.querySelector('button')),
      add: items.find((item) => item.querySelector('button'))?.querySelector('button') ?? null,
    }
  }
  const chips = (label: string) =>
    Array.from(field(label).querySelectorAll('.v-chip')).map((chip) => chip.textContent?.trim())

  return { ...ui, rows: ui.rows[queueId], list, card, field, search, offered, chips }
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
    // The name with the identifier of the author behind it.
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

    rows[0].canEditMetadata = true
    await nextTick()
    await nextTick()

    expect(addAuthor(card)?.disabled).toBe(false)
  })

  // Two authors of one name: the server could not tell which was meant, and says so with the metadata of the asset.
  const withConflicts = (assetId: string, authors: string[]) =>
    assetDetail(assetId, {
      authors,
      metadata: {
        customData: {},
        authorSuggestions: { 'J. Roe': ['author-john', 'author-jane'], 'Somebody Else': ['author-jane'] },
        keywordSuggestions: {},
      },
    })
  // Chips with a plus, under the input and not in it.
  const conflicts = (card: HTMLElement) =>
    Array.from(card.querySelectorAll<HTMLElement>('.v-chip')).filter(
      (chip) => chip.querySelector('.v-chip__close') && !chip.closest('.v-autocomplete')
    )

  it('offers the author conflicts of an upload under it, by name, and adds the one pressed to the authors of the row', async () => {
    // A warning on a settled row: its refresh button is there, and the answer brings the metadata.
    const { rows, card, chips } = await mountQueue([
      queueRow({ status: 'uploaded', error: { hasError: true, message: 'warned', assetFileFailReason: 'none' } }),
    ])
    server.asset(withConflicts('asset-1', ['author-jane']))
    buttonsNamed(card, 'Refresh')[0].click()
    await vi.advanceTimersByTimeAsync(NAMES_READ)
    expect(rows[0].authorConflicts).toEqual(['author-john', 'author-jane'])

    expect(card.textContent).toContain('Author conflicts')
    expect(conflicts(card).map((chip) => chip.textContent?.trim())).toEqual(['John Doe', 'Jane Roe (TASR)'])

    conflicts(card)[0].querySelector<HTMLElement>('.v-chip__close')?.click()
    await vi.advanceTimersByTimeAsync(NAMES_READ)

    expect(rows[0].authors).toEqual(['author-jane', 'author-john'])
    expect(chips('Authors')).toEqual(['Jane Roe (TASR)', 'John Doe'])

    // The chip that was pressed is gone; the row still knows of the conflict.
    expect(conflicts(card).map((chip) => chip.textContent?.trim())).toEqual(['Jane Roe (TASR)'])
    expect(rows[0].authorConflicts).toEqual(['author-john', 'author-jane'])

    // One the row has already is not added twice.
    conflicts(card)[0].querySelector<HTMLElement>('.v-chip__close')?.click()
    await nextTick()

    expect(rows[0].authors).toEqual(['author-jane', 'author-john'])
    expect(conflicts(card)).toEqual([])
  })

  // As it is today: the batch load of the assets picked for mass edit asks for the names of their authors only.
  it('offers the author conflicts of an asset picked for mass edit without their names: the chips go on spinning', async () => {
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
      ['', true],
      ['', true],
    ])
    expect(asked.filter((url) => url.startsWith('/adm/v1/author/'))).toEqual([])
  })

  it('offers no author conflicts while the metadata of the row cannot be edited', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', authorConflicts: ['author-john'] })])
    await vi.advanceTimersByTimeAsync(NAMES_READ)

    expect(card.textContent).not.toContain('Author conflicts')
  })
})
