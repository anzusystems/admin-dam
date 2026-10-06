import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App, Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

const queue = vi.hoisted(() => ({ types: [] as string[], written: [] as string[] }))
const extSystem = vi.hoisted(() => ({ config: {} as Record<string, unknown> }))

vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({
    getQueueItemsTypes: () => queue.types,
    queueItemsReplaceEmptyCustomDataValue: () => undefined,
    queueItemsReplaceEmptyKeywords: (_queueId: string, _value: unknown, forceReplace = false) =>
      queue.written.push(forceReplace ? 'keywords replaced' : 'keywords filled'),
    queueItemsReplaceEmptyAuthors: (_queueId: string, _value: unknown, forceReplace = false) =>
      queue.written.push(forceReplace ? 'authors replaced' : 'authors filled'),
  }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({ getDamConfigExtSystem: () => extSystem.config }),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue', async () => {
  const { h } = await import('vue')

  return { default: { render: () => h('div', { 'data-input': 'keywords' }) } }
})
vi.mock('@/domains/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue', async () => {
  const { h } = await import('vue')

  return { default: { render: () => h('div', { 'data-input': 'authors' }) } }
})
vi.mock('@/domains/coreDam/shared/components/customMetadata/AssetCustomMetadataFormMassOperations.vue', () => ({
  default: { render: () => null },
}))

const AssetQueueSelectedSidebar = (
  await import('@/domains/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue')
).default

let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

/** Mounts the sidebar over a queue of the given asset types and answers what it offers and what it writes. */
const sidebar = async (types: string[]) => {
  queue.types = types
  queue.written = []
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetQueueSelectedSidebar as Component, { queueId: 'queue' })
  app.use(createPinia())
  app.use(createVuetify({ components }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.mount(root)
  await nextTick()
  await nextTick()
  const [fillAll, replaceAll] = Array.from(root.querySelectorAll<HTMLButtonElement>('.sidebar-info__actions button'))

  return {
    inputs: Array.from(root.querySelectorAll('[data-input]')).map((input) => input.getAttribute('data-input')),
    fillAll: () => {
      fillAll.click()
      return queue.written.splice(0)
    },
    replaceAll: () => {
      replaceAll.click()
      return queue.written.splice(0)
    },
  }
}

// The rows of the queue show keywords and authors only where the ext system has them on for the asset type.
describe('mass operations of the queue: keywords and authors', () => {
  it('are offered and written only when a type in the queue has them enabled', async () => {
    extSystem.config = {
      image: { keywords: { enabled: true }, authors: { enabled: false } },
      document: { keywords: { enabled: false }, authors: { enabled: true } },
    }

    const images = await sidebar(['image'])
    expect(images.inputs).toEqual(['keywords'])
    expect(images.fillAll()).toEqual(['keywords filled'])
    expect(images.replaceAll()).toEqual(['keywords replaced'])
    app?.unmount()

    // Documents have authors and no keywords: "fill all" used to write both, whatever the types of the queue.
    const documents = await sidebar(['document'])
    expect(documents.inputs).toEqual(['authors'])
    expect(documents.fillAll()).toEqual(['authors filled'])
    expect(documents.replaceAll()).toEqual(['authors replaced'])
  })

  it('are left out altogether where no type in the queue has them', async () => {
    extSystem.config = { image: { keywords: { enabled: false }, authors: { enabled: false } }, video: {} }

    const neither = await sidebar(['image', 'video'])
    expect(neither.inputs).toEqual([])
    expect(neither.fillAll()).toEqual([])
    expect(neither.replaceAll()).toEqual([])
  })

  // Which items they are written into is the store's part (`lazyMetadata.test.ts`): only those of such a type.
  it('are both offered for a queue of types that have one each', async () => {
    extSystem.config = {
      image: { keywords: { enabled: true }, authors: { enabled: false } },
      document: { keywords: { enabled: false }, authors: { enabled: true } },
    }

    const mixed = await sidebar(['image', 'document'])
    expect(mixed.inputs).toEqual(['keywords', 'authors'])
    expect(mixed.fillAll()).toEqual(['authors filled', 'keywords filled'])
  })
})
