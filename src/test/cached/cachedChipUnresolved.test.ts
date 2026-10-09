import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App, Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The chips that show a keyword or an author by its id, over the real caches and a fake server. An id the server
 * does not return used to leave the chip spinning for good; now it shows the id. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
// The chips ask the queue only whether a name is new, and only when they are given a queue.
vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({ getQueue: () => undefined }),
}))

const KeywordChip = (
  await import('@/domains/coreDam/keyword/components/KeywordRemoteAutocompleteCachedKeywordChip.vue')
).default
const AuthorChip = (await import('@/domains/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'))
  .default
const AuthorConflictsChip = (
  await import('@/domains/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChipConflicts.vue')
).default
const { useCachedKeywords } = await import('@/domains/coreDam/keyword/composables/cachedKeywords')
const { useCachedAuthors } = await import('@/domains/coreDam/author/composables/cachedAuthors')

const { addToCachedKeywords, fetchCachedKeywords } = useCachedKeywords()
const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()

const KEYWORDS = /^\/adm\/v1\/keyword\/ext-system\/1\/search$/
const AUTHORS = /^\/adm\/v1\/author\/ext-system\/1\/search$/
const UNAVAILABLE = 'common.model.cachedUnavailable'

const keyword = (id: string) => ({ id, name: 'Bratislava' })
const author = (id: string) => ({ id, name: 'Jane Roe', identifier: 'TASR', flags: { reviewed: false } })

interface Kind {
  chip: Component
  url: RegExp
  record: (id: string) => unknown
  /** What the chip shows for the record above. */
  name: string
  add: (id: string) => void
  fetch: () => unknown
}

const kinds: Record<string, Kind> = {
  'the keyword chip': {
    chip: KeywordChip,
    url: KEYWORDS,
    record: keyword,
    name: 'Bratislava',
    add: addToCachedKeywords,
    fetch: fetchCachedKeywords,
  },
  'the author chip': {
    chip: AuthorChip,
    url: AUTHORS,
    record: author,
    name: 'Jane Roe (TASR)',
    add: addToCachedAuthors,
    fetch: fetchCachedAuthors,
  },
  'the chip of an author conflict': {
    chip: AuthorConflictsChip,
    url: AUTHORS,
    record: author,
    name: 'Jane Roe (TASR)',
    add: addToCachedAuthors,
    fetch: fetchCachedAuthors,
  },
}

let app: App | undefined
// The caches live as long as the module: every case asks for an id of its own.
let serial = 0
let asked = ''

const mountChip = async (kind: Kind, props: Record<string, unknown> = {}) => {
  const id = 'id-' + ++serial
  asked = id
  kind.add(id)
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(kind.chip, { id, ...props })
  app.use(createVuetify({ components }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.mount(root)
  await nextTick()

  return {
    id,
    text: () => root.textContent?.trim(),
    spinning: () => root.querySelector('.v-progress-circular') !== null,
    explained: () => root.querySelector(`[title="${UNAVAILABLE}"]`) !== null,
    /** The cache asks the server for what it was told to; the answer is in when this resolves. */
    answered: async () => {
      kind.fetch()
      await vi.advanceTimersByTimeAsync(10_000)
      await nextTick()
    },
  }
}

/** The server has the record the case asks for, or it has not. */
const answerWith = (kind: Kind, found: () => boolean) =>
  server.on('GET', kind.url, () => ({ status: 200, data: { data: found() ? [kind.record(asked)] : [] } }))

beforeEach(() => {
  vi.useFakeTimers()
  server = createFakeDam()
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe.each(Object.entries(kinds))('%s', (_name, kind) => {
  it('spins while the record is on its way', async () => {
    server.on('GET', kind.url, () => new Promise(() => undefined))
    const chip = await mountChip(kind)

    expect(chip.spinning()).toBe(true)
    expect(chip.text()).toBe('')

    await chip.answered()

    expect(chip.spinning()).toBe(true)
    expect(chip.text()).toBe('')
    expect(chip.explained()).toBe(false)
  })

  it('shows the name once the server returned the record', async () => {
    answerWith(kind, () => true)
    const chip = await mountChip(kind)

    await chip.answered()

    expect(chip.text()).toBe(kind.name)
    expect(chip.spinning()).toBe(false)
    expect(chip.explained()).toBe(false)
  })

  it('shows the id, and says why, when the server does not return the record', async () => {
    answerWith(kind, () => false)
    const chip = await mountChip(kind)

    await chip.answered()

    expect(chip.text()).toBe('#' + chip.id)
    expect(chip.spinning()).toBe(false)
    expect(chip.explained()).toBe(true)
  })

  it('shows the id when the records cannot be read at all', async () => {
    server.on('GET', kind.url, () => {
      throw new Error('the server is down')
    })
    const chip = await mountChip(kind)

    await chip.answered()

    expect(chip.text()).toBe('#' + chip.id)
    expect(chip.spinning()).toBe(false)
  })

  it('shows the name after all when the record is asked for again and is there', async () => {
    let created = false
    answerWith(kind, () => created)
    const chip = await mountChip(kind)
    await chip.answered()
    expect(chip.text()).toBe('#' + chip.id)

    created = true
    kind.add(chip.id)
    await nextTick()
    expect(chip.spinning()).toBe(true)
    expect(chip.text()).toBe('')

    await chip.answered()

    expect(chip.text()).toBe(kind.name)
    expect(chip.spinning()).toBe(false)
    expect(chip.explained()).toBe(false)
  })
})

describe.each([
  ['the keyword chip', kinds['the keyword chip']],
  ['the author chip', kinds['the author chip']],
])('%s', (_name, kind) => {
  it('shows the id as plain text too', async () => {
    answerWith(kind, () => false)
    const chip = await mountChip(kind, { textOnly: true })

    await chip.answered()

    expect(chip.text()).toBe('#' + chip.id)
    expect(chip.spinning()).toBe(false)
    expect(chip.explained()).toBe(true)
  })

  it('keeps a title it was handed, whatever the server returns', async () => {
    answerWith(kind, () => false)
    const chip = await mountChip(kind, { title: 'Handed in' })
    expect(chip.text()).toBe('Handed in')
    expect(chip.spinning()).toBe(false)

    await chip.answered()

    expect(chip.text()).toBe('Handed in')
    expect(chip.explained()).toBe(false)
  })
})
