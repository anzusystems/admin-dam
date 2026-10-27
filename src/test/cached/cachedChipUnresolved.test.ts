import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/*
 * Library chip that shows an author by id, over the real cache and a fake server. Bug:
 * an id the server does not return left the chip spinning for good. Now it shows the id.
 * Chips inside library inputs are tested in the library (`damNameChipsUnresolved.test.ts`).
 * The library cache asks through its plugin client and the ext system the app start writes,
 * so the plugin is installed with the app client and the ext system is written the same way.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const { useCachedAuthors } = await import('@/domains/coreDam/author/composables/cachedAuthors')
const { ADamAuthorCachedChip, AnzuSystemsCommonAdmin, useExtSystemIdForCached } =
  await import('@anzusystems/common-admin')
const { damClient } = await import('@/shared/apiClients/damClient')

useExtSystemIdForCached().cachedExtSystemId.value = 1

const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()

const AUTHORS = /^\/adm\/v1\/author\/ext-system\/1\/search$/
const UNAVAILABLE = 'common.model.cachedUnavailable'
const NAME = 'Jane Roe (TASR)'

const author = (id: string) => ({ id, name: 'Jane Roe', identifier: 'TASR', flags: { reviewed: false } })

let app: App | undefined
// The cache lives as long as the module: every case asks for an id of its own.
let serial = 0
let asked = ''

const mountChip = async (props: Record<string, unknown> = {}) => {
  const id = 'id-' + ++serial
  asked = id
  addToCachedAuthors(id)
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(ADamAuthorCachedChip, { id, ...props })
  const i18n = createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false })
  app.use(createVuetify({ components }))
  app.use(i18n)
  app.use(AnzuSystemsCommonAdmin, {
    i18n: i18n as never,
    languages: { available: ['en'], default: 'en' },
    coreDam: { configs: { default: { damClient } }, apiTimeout: 30, adminDomain: 'https://dam.test' },
  })
  app.mount(root)
  await nextTick()

  return {
    id,
    text: () => root.textContent?.trim(),
    spinning: () => root.querySelector('.v-progress-circular') !== null,
    tooltip: async () => {
      root.querySelector('.v-chip')?.dispatchEvent(new MouseEvent('mouseenter'))
      await vi.advanceTimersByTimeAsync(1000)

      return document.body.querySelector('.v-tooltip .v-overlay__content')?.textContent?.trim()
    },
    title: () => root.querySelector('[title]')?.getAttribute('title'),
    answered: async () => {
      fetchCachedAuthors()
      await vi.advanceTimersByTimeAsync(10_000)
      await nextTick()
    },
  }
}

const answerWith = (found: () => boolean) =>
  server.on('GET', AUTHORS, () => ({ status: 200, data: { data: found() ? [author(asked)] : [] } }))

beforeEach(() => {
  vi.useFakeTimers()
  // happy-dom has no `visualViewport`, and an open tooltip listens on it for window resize.
  vi.stubGlobal('visualViewport', new EventTarget())
  server = createFakeDam()
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the author chip', () => {
  it('spins while the record is on its way', async () => {
    server.on('GET', AUTHORS, () => new Promise(() => undefined))
    const chip = await mountChip()

    expect(chip.spinning()).toBe(true)
    expect(chip.text()).toBe('')

    await chip.answered()

    expect(chip.spinning()).toBe(true)
    expect(chip.text()).toBe('')
    expect(await chip.tooltip()).toBeUndefined()
  })

  it('shows the name once the server returned the record', async () => {
    answerWith(() => true)
    const chip = await mountChip()

    await chip.answered()

    expect(chip.text()).toBe(NAME)
    expect(chip.spinning()).toBe(false)
    expect(await chip.tooltip()).toBeUndefined()
  })

  it('shows the id, and says why, when the server does not return the record', async () => {
    answerWith(() => false)
    const chip = await mountChip()

    await chip.answered()

    expect(chip.text()).toBe('#' + chip.id)
    expect(chip.spinning()).toBe(false)
    expect(await chip.tooltip()).toBe(UNAVAILABLE)
  })

  it('shows the id when the records cannot be read at all', async () => {
    server.on('GET', AUTHORS, () => {
      throw new Error('the server is down')
    })
    const chip = await mountChip()

    await chip.answered()

    expect(chip.text()).toBe('#' + chip.id)
    expect(chip.spinning()).toBe(false)
  })

  it('shows the name after all when the record is asked for again and is there', async () => {
    let created = false
    answerWith(() => created)
    const chip = await mountChip()
    await chip.answered()
    expect(chip.text()).toBe('#' + chip.id)

    created = true
    addToCachedAuthors(chip.id)
    await nextTick()
    expect(chip.spinning()).toBe(true)
    expect(chip.text()).toBe('')

    await chip.answered()

    expect(chip.text()).toBe(NAME)
    expect(chip.spinning()).toBe(false)
    expect(await chip.tooltip()).toBeUndefined()
  })

  it('shows the id as plain text too', async () => {
    answerWith(() => false)
    const chip = await mountChip({ textOnly: true })

    await chip.answered()

    expect(chip.text()).toBe('#' + chip.id)
    expect(chip.spinning()).toBe(false)
    expect(chip.title()).toBe(UNAVAILABLE)
  })

  it('keeps a title it was handed, whatever the server returns', async () => {
    answerWith(() => false)
    const chip = await mountChip({ title: 'Handed in' })
    expect(chip.text()).toBe('Handed in')
    expect(chip.spinning()).toBe(false)

    await chip.answered()

    expect(chip.text()).toBe('Handed in')
    expect(await chip.tooltip()).toBe(UNAVAILABLE)
  })
})
