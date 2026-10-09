import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, customField, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/* The mass operations beside the rows of an editable queue: a scratch form whose values are copied into the rows,
 * one field at a time or all at once, into the empty ones only or over what is there. The real sidebar, with its
 * real inputs, in the real list over the real store: a value is typed, a keyword is searched for and picked, a
 * button is pressed, and the rows of the store are read. The server is a fake that knows two keywords and an author.
 *
 * Which of keywords and authors the sidebar offers at all is in `massOperationsSidebar.test.ts`; that its fields
 * are not validated, in `asset/assetMetadataValidation.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'
const FILL = 'Fill empty'
const REPLACE = 'Replace in all assets'
const FILL_ALL = 'Fill all empty'
const REPLACE_ALL = 'Replace all'
const CLEAR_FORM = 'Clear form'

const KEYWORDS = [
  { id: 'keyword-bratislava', name: 'Bratislava' },
  { id: 'keyword-kosice', name: 'Kosice' },
]
const AUTHORS = [{ id: 'author-jane', name: 'Jane Roe', identifier: 'TASR', flags: { reviewed: true } }]

const row = (assetId: string, over: Partial<UploadQueueItem> = {}) =>
  queueRow({ status: 'uploaded', canEditMetadata: true, assetId, fileId: 'file-of-' + assetId, ...over })

const forms = {
  image: [customField('title'), customField('note')],
  audio: [customField('title')],
}

/** Mounts the editable list over the rows and answers its sidebar, by what the user finds in it. */
const mountQueue = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}) => {
  const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, customForm: forms, ...setup })
  // The server finds a keyword or an author by its ids or by a text in its name.
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, (_request, match) => {
    const query = new URLSearchParams(ui.asked[ui.asked.length - 1].split('?')[1])
    const ids = query.get('id')?.split(',')
    const searched = (query.get('text') ?? '').toLowerCase()
    const data = (match[1] === 'keyword' ? KEYWORDS : AUTHORS).filter((record) =>
      ids ? ids.includes(record.id) : record.name.toLowerCase().includes(searched)
    )

    return { status: 200, data: { data, totalCount: data.length } }
  })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
    queueId: QUEUE,
    massOperations: true,
  })
  const sidebar = list.querySelector<HTMLElement>('.asset-queue-editable__sidebar')!
  const panels = () => Array.from(sidebar.querySelectorAll<HTMLElement>('.v-expansion-panel'))
  const titleOf = (panel: HTMLElement) => panel.querySelector('.v-expansion-panel-title')?.textContent?.trim()
  const panel = (title: string) => {
    const found = panels().find((one) => titleOf(one) === title)
    if (!found) throw new Error(`the sidebar has no "${title}" panel`)

    return found
  }
  const open = async (title: string) => {
    if (panel(title).classList.contains('v-expansion-panel--active')) return
    panel(title).querySelector<HTMLButtonElement>('.v-expansion-panel-title')?.click()
    await nextTick()
  }
  /** The scratch field of the panel with that label: its input, and the two buttons that stand beside it. */
  const field = (panelTitle: string, label: string) => {
    const input = Array.from(panel(panelTitle).querySelectorAll<HTMLElement>('.v-input')).find(
      (one) => one.querySelector('label')?.textContent?.trim() === label
    )
    if (!input) throw new Error(`the "${panelTitle}" panel has no "${label}" field`)
    let line: HTMLElement = input
    while (buttonsNamed(line, FILL).length === 0) line = line.parentElement!

    return { input, fill: buttonsNamed(line, FILL)[0], replace: buttonsNamed(line, REPLACE)[0] }
  }
  const type = async (panelTitle: string, label: string, value: string) => {
    await open(panelTitle)
    const textarea = field(panelTitle, label).input.querySelector('textarea')!
    textarea.value = value
    textarea.dispatchEvent(new Event('input'))
    await nextTick()
  }
  /** Searches the keyword or author input of the general panel for the name, and picks what the server found. */
  const pick = async (label: string, name: string) => {
    const input = field('General', label).input.querySelector<HTMLInputElement>('input[type="text"]')!
    input.focus()
    input.value = name
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)
    const option = Array.from(document.body.querySelectorAll<HTMLElement>('.v-overlay-container .v-list-item')).find(
      (item) => item.textContent?.includes(name) && !item.querySelector('button')
    )
    if (!option) throw new Error(`the server found no "${name}"`)
    option.click()
    await vi.advanceTimersByTimeAsync(1000)
  }
  const press = async (button: HTMLButtonElement | undefined) => {
    if (!button) throw new Error('no such button')
    button.click()
    await nextTick()
  }
  const all = (name: string) => buttonsNamed(sidebar, name)[0]

  return { ...ui, rows: ui.rows[QUEUE], list, sidebar, panels, titleOf, panel, open, field, type, pick, press, all }
}

const titles = (rows: UploadQueueItem[]) => rows.map((one) => one.customData.title)

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the panels of the mass operations', () => {
  it('are one for keywords and authors and one for each asset type the queue holds, the first type open', async () => {
    const { panels, titleOf } = await mountQueue([
      row('asset-1', { assetType: 'audio' }),
      row('asset-2', { assetType: 'image' }),
      row('asset-3', { assetType: 'audio' }),
    ])

    expect(panels().map(titleOf)).toEqual(['General', 'Image', 'Audio'])
    // Open: the general one and the type of the first row.
    expect(panels().map((panel) => panel.classList.contains('v-expansion-panel--active'))).toEqual([true, false, true])
  })

  it('hold a scratch field, with its two buttons, for each custom field of the type that can be written', async () => {
    const { panel, field } = await mountQueue([row('asset-1'), row('asset-2')], {
      customForm: { image: [customField('title'), customField('locked', { readonly: true }), customField('note')] },
    })

    const labels = Array.from(panel('Image').querySelectorAll('.v-input label.v-field-label--floating')).map((label) =>
      label.textContent?.trim()
    )
    expect(labels).toEqual(['title', 'note'])
    expect([field('Image', 'title').fill, field('Image', 'title').replace].every(Boolean)).toBe(true)
    expect(buttonsNamed(panel('Image'), 'Fill empty')).toHaveLength(2)
  })
})

describe('a custom field of the mass operations', () => {
  const queue = () => [
    row('asset-1', { customData: { title: '', note: 'first' } }),
    row('asset-2', { customData: { title: 'kept', note: 'second' } }),
    row('asset-3', { assetType: 'audio', customData: { title: '' } }),
  ]

  it('is filled into the rows of its asset type that have it empty, by its "fill empty" button', async () => {
    const { rows, type, press, field } = await mountQueue(queue())
    await type('Image', 'title', 'filled')

    await press(field('Image', 'title').fill)

    expect(titles(rows)).toEqual(['filled', 'kept', ''])
    // No other field of a row is touched.
    expect(rows.map((one) => one.customData.note)).toEqual(['first', 'second', undefined])
  })

  it('is written over what the rows of its asset type have, by its "replace" button', async () => {
    const { rows, type, press, field } = await mountQueue(queue())
    await type('Image', 'title', 'replaced')

    await press(field('Image', 'title').replace)

    expect(titles(rows)).toEqual(['replaced', 'replaced', ''])
    expect(rows.map((one) => one.customData.note)).toEqual(['first', 'second', undefined])
  })

  it('goes to the rows of its own asset type only, also where two types have a field of one name', async () => {
    const { rows, type, press, field } = await mountQueue(queue())
    await type('Audio', 'title', 'a recording')

    await press(field('Audio', 'title').replace)

    expect(titles(rows)).toEqual(['', 'kept', 'a recording'])
  })

  it('takes the value of the rows away when it is replaced by a field nothing was typed into', async () => {
    const { rows, press, field } = await mountQueue(queue())

    await press(field('Image', 'title').replace)

    expect(titles(rows)).toEqual([undefined, undefined, ''])
  })

  it('shows in the form of the row what it wrote there', async () => {
    const { type, press, field, list } = await mountQueue(queue())
    await type('Image', 'title', 'filled')

    await press(field('Image', 'title').fill)

    const shown = Array.from(list.querySelectorAll<HTMLElement>('.dam-upload-queue__item')).map(
      (card) => card.querySelector<HTMLTextAreaElement>('[data-cy="custom-field-title"] textarea')?.value
    )
    expect(shown).toEqual(['filled', 'kept', ''])
  })
})

describe('the keywords and the authors of the mass operations', () => {
  const queue = () => [
    row('asset-1'),
    row('asset-2', { keywords: ['keyword-kosice'], authors: ['author-other'] }),
    row('asset-3', { assetType: 'document' }),
  ]
  // Documents have neither keywords nor authors here.
  const noneForDocuments = {
    extSystem: {
      document: { keywords: { enabled: false, required: false }, authors: { enabled: false, required: false } },
    },
  }

  it('are filled into the rows that have none, by their "fill empty" buttons', async () => {
    const { rows, pick, press, field } = await mountQueue(queue(), noneForDocuments)
    await pick('Keywords', 'Bratislava')
    await pick('Authors', 'Jane Roe')

    await press(field('General', 'Keywords').fill)

    expect(rows.map((one) => one.keywords)).toEqual([['keyword-bratislava'], ['keyword-kosice'], []])
    // Each button writes its own field.
    expect(rows.map((one) => one.authors)).toEqual([[], ['author-other'], []])

    await press(field('General', 'Authors').fill)

    expect(rows.map((one) => one.authors)).toEqual([['author-jane'], ['author-other'], []])
  })

  it('are written over what the rows have, by their "replace" buttons', async () => {
    const { rows, pick, press, field } = await mountQueue(queue(), noneForDocuments)
    await pick('Keywords', 'Bratislava')
    await pick('Authors', 'Jane Roe')

    await press(field('General', 'Keywords').replace)
    await press(field('General', 'Authors').replace)

    // Never into a row whose asset type has them off.
    expect(rows.map((one) => one.keywords)).toEqual([['keyword-bratislava'], ['keyword-bratislava'], []])
    expect(rows.map((one) => one.authors)).toEqual([['author-jane'], ['author-jane'], []])
  })

  it('show by name in the rows they were written into', async () => {
    const { pick, press, field, list } = await mountQueue(queue(), noneForDocuments)
    await pick('Keywords', 'Bratislava')

    await press(field('General', 'Keywords').replace)
    await vi.advanceTimersByTimeAsync(1000)

    const chips = Array.from(list.querySelectorAll<HTMLElement>('.dam-upload-queue__item')).map((card) =>
      Array.from(card.querySelectorAll('.v-chip')).map((chip) => chip.textContent?.trim())
    )
    expect(chips).toEqual([['Bratislava'], ['Bratislava', '#author-other'], []])
  })
})

describe('the buttons under the mass operations', () => {
  const queue = () => [
    row('asset-1', { customData: { title: '', note: 'first' } }),
    row('asset-2', { customData: { title: 'kept', note: 'second' }, keywords: ['keyword-kosice'] }),
    row('asset-3', { assetType: 'audio', customData: {} }),
  ]

  it('"fill all empty" fills every field that was given a value into the rows that have it empty', async () => {
    const { rows, type, pick, press, all } = await mountQueue(queue())
    await type('Image', 'title', 'a picture')
    await type('Audio', 'title', 'a recording')
    await pick('Keywords', 'Bratislava')
    await pick('Authors', 'Jane Roe')

    await press(all(FILL_ALL))

    expect(titles(rows)).toEqual(['a picture', 'kept', 'a recording'])
    expect(rows.map((one) => one.keywords)).toEqual([
      ['keyword-bratislava'],
      ['keyword-kosice'],
      ['keyword-bratislava'],
    ])
    expect(rows.map((one) => one.authors)).toEqual([['author-jane'], ['author-jane'], ['author-jane']])
    expect(rows.map((one) => one.customData.note)).toEqual(['first', 'second', undefined])
  })

  it('"replace all" writes every field that was given a value over what the rows have', async () => {
    const { rows, type, pick, press, all } = await mountQueue(queue())
    await type('Image', 'title', 'a picture')
    await pick('Keywords', 'Bratislava')
    await pick('Authors', 'Jane Roe')

    await press(all(REPLACE_ALL))

    expect(titles(rows)).toEqual(['a picture', 'a picture', undefined])
    expect(rows.map((one) => one.keywords)).toEqual([
      ['keyword-bratislava'],
      ['keyword-bratislava'],
      ['keyword-bratislava'],
    ])
    expect(rows.map((one) => one.authors)).toEqual([['author-jane'], ['author-jane'], ['author-jane']])
    // A custom field nothing was typed into is left as the rows have it.
    expect(rows.map((one) => one.customData.note)).toEqual(['first', 'second', undefined])
  })

  // Unlike a custom field: the keywords and the authors of the form are written also when none was picked.
  it('"replace all" takes the keywords and the authors of every row away when the form holds none', async () => {
    const { rows, type, press, all } = await mountQueue([
      row('asset-1', { keywords: ['keyword-kosice'], authors: ['author-other'], customData: { title: 'kept' } }),
      row('asset-2', { keywords: ['keyword-bratislava'], authors: [] }),
    ])
    await type('Image', 'note', 'a note')

    await press(all(REPLACE_ALL))

    expect(rows.map((one) => one.customData)).toEqual([{ title: 'kept', note: 'a note' }, { note: 'a note' }])
    expect(rows.map((one) => [one.keywords, one.authors])).toEqual([
      [[], []],
      [[], []],
    ])
  })

  it('"clear form" empties the form and leaves the rows alone; nothing of the old form is written afterwards', async () => {
    const { rows, type, pick, press, all, field } = await mountQueue(queue())
    await type('Image', 'title', 'a picture')
    await pick('Keywords', 'Bratislava')

    await press(all(CLEAR_FORM))

    expect(field('Image', 'title').input.querySelector('textarea')?.value).toBe('')
    expect(field('General', 'Keywords').input.querySelectorAll('.v-chip')).toHaveLength(0)
    expect(titles(rows)).toEqual(['', 'kept', undefined])

    await press(all(FILL_ALL))

    expect(titles(rows)).toEqual(['', 'kept', undefined])
    expect(rows.map((one) => one.keywords)).toEqual([[], ['keyword-kosice'], []])
  })
})
