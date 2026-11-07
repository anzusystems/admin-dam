import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'

import type {
  CustomDataFormElement,
  DamAssetTypeType,
  DamExtSystemConfigItem,
  UploadQueueItem,
} from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import { createApp, defineComponent, getCurrentInstance, h, nextTick } from 'vue'
import type { App, Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { seedDamConfig, seedQueue } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/*
 * The application around an upload component, set up as `main.ts` does: the library plugin with the app
 * client, English messages, Vuetify as the library configures it, the alerts host and a user with grants.
 * The DAM config is written into the library store as its load does. The
 * only stand-in is the router, which knows one page: the asset detail.
 * Every start evaluates modules anew, so a case leaves no user, cache or open footer
 * for the next. Time is faked from start to `stopUploadUi`, so no timer is left either.
 */

type AssetTypeConfig = Omit<DamExtSystemConfigItem, 'customMetadataPinnedAmount'> & {
  customMetadataPinnedAmount?: number
}

export interface UploadUiSetup {
  server: FakeDam
  grants?: string[]
  extSystem?: Partial<Record<DamAssetTypeType, Partial<AssetTypeConfig>>>
  customForm?: Partial<Record<DamAssetTypeType, CustomDataFormElement[]>>
  queues?: Record<string, UploadQueueItem[]>
}

const UPLOAD_GRANTS = [
  'dam_asset_create',
  'dam_asset_update',
  'dam_asset_delete',
  'dam_image_create',
  'dam_audio_create',
  'dam_video_create',
  'dam_document_create',
  'dam_keyword_create',
  'dam_author_create',
]

const GRANT_ALLOW = 2
const EXT_SYSTEM = 1
const LICENCE = 1

let mounted: App[] = []

export const customField = (
  property: string,
  attributes: Partial<CustomDataFormElement['attributes']> = {}
): CustomDataFormElement =>
  ({
    id: 'element-' + property,
    property,
    name: property,
    position: 1,
    attributes: {
      type: 'string',
      minValue: null,
      maxValue: null,
      minCount: null,
      maxCount: null,
      required: false,
      searchable: false,
      readonly: false,
      ...attributes,
    },
  }) as CustomDataFormElement

export const startUploadUi = async (setup: UploadUiSetup) => {
  // A component whose setup threw leaves Vue believing it is still inside that setup. Every store asked
  // for afterwards is the store of that dead application, so later cases would fail for unrelated reasons.
  if (getCurrentInstance()) throw new Error('uploadUi: a component mounted before this start failed in its setup')
  recordListeners()
  pluginsBefore = devtoolsPlugins()?.length ?? 0
  /*
   * Vue keeps every mounted component for its devtools until it
   * gives up, three seconds after its first application is made.
   * Under the fake clock below, which is thrown away with the case, those three seconds never
   * pass and every case of the file stays. So the first application is made on the real clock.
   */
  createApp({})
  /*
   * The clock of every case is fake and thrown away at the end of the case. A deferred name
   * lookup, queue poll or closing dialog of one case cannot fire in the next, into its server.
   * A case moves time itself (`vi.advanceTimersByTimeAsync`) or waits with `vi.waitFor`, which moves it.
   */
  vi.useFakeTimers()
  vi.resetModules()
  // happy-dom has no `visualViewport`, and a dialog listens on it for the window size.
  vi.stubGlobal('visualViewport', new EventTarget())
  // Keeps each requested address whole, because `server.requests` drops the query string.
  const asked: string[] = []
  const { get, request } = setup.server.client
  setup.server.client.get = (url, config) => {
    asked.push(url)

    return get(url, config)
  }
  setup.server.client.request = (config) => {
    asked.push(config.url ?? '')

    return request(config)
  }
  const pinia = createPinia()
  setActivePinia(pinia)
  const library = await import('@anzusystems/common-admin')
  const vuetifyComponents = await import('vuetify/components')
  const { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n } = await import('@/plugins/i18n')
  i18n.global.setLocaleMessage('en', (await import('@/locales/en')).default as never)
  i18n.global.locale.value = 'en'
  const { coreDamDefaultConfig } = await import('@/plugins/commonAdminCoreDam')

  const config = library.useDamConfigStore()
  seedDamConfig(config, 1024, EXT_SYSTEM)
  config.damPrvConfig = {
    ...config.damPrvConfig,
    settings: { ...config.damPrvConfig.settings, defaultExtSystemId: EXT_SYSTEM, defaultAssetLicenceId: LICENCE },
  }
  config.initialized.damPrvConfig = true
  const extSystem = config.damConfigExtSystem.get(EXT_SYSTEM) as Record<DamAssetTypeType, AssetTypeConfig>
  for (const [assetType, over] of Object.entries(setup.extSystem ?? {})) {
    extSystem[assetType as DamAssetTypeType] = { ...extSystem[assetType as DamAssetTypeType], ...over }
  }
  config.damConfigAssetCustomFormElements.set(EXT_SYSTEM, {
    image: [],
    audio: [],
    video: [],
    document: [],
    ...setup.customForm,
  })

  const { useAuth } = await import('@/domains/system/auth/auth')
  const grants = Object.fromEntries((setup.grants ?? UPLOAD_GRANTS).map((grant) => [grant, GRANT_ALLOW]))
  useAuth()
    .useCurrentUser('dam')
    .setCurrentUser({
      id: 7,
      roles: [],
      resolvedPermissions: grants,
      selectedLicenceDto: null,
      assetLicencesDto: [],
    } as never)
  const { initCurrentExtSystemAndLicence } = await import('@/domains/coreDam/asset/composables/currentExtSystem')
  if (!(await initCurrentExtSystemAndLicence())) throw new Error('uploadUi: no ext system for the user')

  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const store = useUploadQueuesStore()
  const rows: Record<string, UploadQueueItem[]> = {}
  for (const [queueId, items] of Object.entries(setup.queues ?? {})) {
    rows[queueId] = seedQueue(store, queueId, items)
    store.recalculateQueueCounts(queueId)
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: { render: () => null } },
    ],
  })
  // The user is on a page with no navigation pending. A component checks this before it reports a failure.
  await router.push('/')

  const mount = async (load: () => Promise<{ default: Component }>, props: Record<string, unknown> = {}) => {
    const component = (await load()).default
    const Page = defineComponent({
      setup: () => () => [h(library.AAlerts), h('div', { 'data-under-test': '' }, [h(component, props)])],
    })
    const root = document.createElement('div')
    document.body.appendChild(root)
    const app = createApp(Page)
      .use(i18n)
      .use(pinia)
      .use(library.createAnzuVuetify({ i18n }))
      .use(router)
      .use(library.AnzuSystemsCommonAdmin, {
        i18n,
        languages: { available: AVAILABLE_LANGUAGES, default: DEFAULT_LANGUAGE },
        coreDam: { configs: { default: coreDamDefaultConfig }, apiTimeout: 30, adminDomain: 'https://dam.test' },
      })
    // The build registers only the Vuetify components a template uses. Here all of them are registered.
    for (const [name, vuetifyComponent] of Object.entries(vuetifyComponents)) {
      app.component(name, vuetifyComponent as Component)
    }
    app.mount(root)
    mounted.push(app)
    await nextTick()

    return root.querySelector<HTMLElement>('[data-under-test]')!
  }

  const alerts = () =>
    Array.from(document.body.querySelectorAll('.a-alerts .v-alert')).map((alert) => alert.textContent?.trim() ?? '')

  return { store, rows, mount, alerts, asked, pinia, library, router }
}

export type UploadUi = Awaited<ReturnType<typeof startUploadUi>>

export const stopUploadUi = () => {
  // Runs even when an unmount throws. Otherwise the window keeps its recording methods into the next case and file.
  try {
    mounted.forEach((app) => app.unmount())
  } finally {
    mounted = []
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
    removeListeners()
    devtoolsPlugins()?.splice(pluginsBefore)
    if (windowResized) setWindowWidth(WINDOW_WIDTH)
    windowResized = false
    collectWhenBig()
  }
}

/*
 * Each start evaluates modules anew, and what a case leaves is garbage afterwards. V8 lets the heap grow and collects
 * late, so a file with many cases held several at once. Above this size, everything is collected after a case.
 * Node does not expose the collector without a flag, so it is enabled by setting the flag at runtime. Node does
 * not promise that works. If the collector is missing or fails, nothing is collected and the case does not fail.
 */
const COLLECTED_ABOVE = 1024 ** 3
let collect: (() => void) | undefined
const collectWhenBig = () => {
  if (process.memoryUsage().heapUsed < COLLECTED_ABOVE) return
  try {
    if (!collect) {
      setFlagsFromString('--expose_gc')
      const gc: unknown = runInNewContext('typeof gc === "function" ? gc : undefined')
      collect = typeof gc === 'function' ? (gc as () => void) : () => undefined
    }
    collect()
  } catch {
    collect = () => undefined
  }
}

type Listener = { target: EventTarget; type: string; listener: EventListenerOrEventListenerObject; capture: boolean }

const captureOf = (options?: boolean | EventListenerOptions) =>
  typeof options === 'boolean' ? options : !!options?.capture

/** A listener is unique per target, type, function and capture flag. Added twice, it exists once. */
const isListener =
  (target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, capture: boolean) =>
  (one: Listener) =>
    one.target === target && one.type === type && one.listener === listener && one.capture === capture

/*
 * The window is shared by the whole file, and every start evaluates modules anew. Listeners
 * that a case's modules leave on the window stay, with all they reach, until the file ends.
 * The library theme settings listen to the dark-scheme media query (in happy-dom
 * a window listener) and to storage from evaluation on, and never stop.
 * So listeners added to the window, the document and the window media queries after a start are recorded.
 * Those still present when the case ends are removed. Listeners from before the start are kept.
 */
let listeners: Listener[] = []
let restoreListening: (() => void)[] = []

const recordOn = (target: EventTarget) => {
  const own = Object.hasOwn(target, 'addEventListener')
  const { addEventListener: add, removeEventListener: remove } = target
  target.addEventListener = (type, listener, options) => {
    const capture = captureOf(options)
    if (listener && !listeners.some(isListener(target, type, listener, capture))) {
      listeners.push({ target, type, listener, capture })
    }
    add.call(target, type, listener, options)
  }
  target.removeEventListener = (type, listener, options) => {
    const at = listener ? listeners.findIndex(isListener(target, type, listener, captureOf(options))) : -1
    if (at !== -1) listeners.splice(at, 1)
    remove.call(target, type, listener, options)
  }
  restoreListening.push(() => {
    if (own) {
      // The vitest window is the global object. Its accessors pass assignments on to the happy-dom window.
      Object.assign(target, { addEventListener: add, removeEventListener: remove })
    } else {
      Reflect.deleteProperty(target, 'addEventListener')
      Reflect.deleteProperty(target, 'removeEventListener')
    }
  })
}

const recordListeners = () => {
  if (restoreListening.length) return
  recordOn(window)
  recordOn(document)
  const { matchMedia } = window
  window.matchMedia = (query: string) => {
    const list = matchMedia(query)
    recordOn(list)

    return list
  }
  restoreListening.push(() => {
    window.matchMedia = matchMedia
  })
}

const removeListeners = () => {
  restoreListening.forEach((restore) => restore())
  restoreListening = []
  const left = listeners
  listeners = []
  left.forEach(({ target, type, listener, capture }) => target.removeEventListener(type, listener, capture))
}

/*
 * vue-i18n announces each application it is installed in to the Vue devtools,
 * in a list on the global object that the devtools read when they attach.
 * The devtools never attach here, so the list would keep the application of every case.
 */
const devtoolsPlugins = () => (globalThis as { __VUE_DEVTOOLS_PLUGINS__?: unknown[] }).__VUE_DEVTOOLS_PLUGINS__
let pluginsBefore = 0

type HappyDomWindow = { happyDOM: { setViewport: (viewport: { width: number; height: number }) => void } }
const WINDOW_WIDTH = 1024
let windowResized = false

/** Lasts until the case is over. Vuetify uses the window width to decide what a small screen is. */
export const setWindowWidth = (width: number) => {
  windowResized = true
  ;(window as unknown as HappyDomWindow).happyDOM.setViewport({ width, height: 768 })
}

export const dialogButton = (name: string) =>
  Array.from(document.body.querySelectorAll<HTMLButtonElement>('.v-dialog button')).find(
    (button) => button.textContent?.trim() === name
  ) ?? null

/**
 * Waits until the check passes, moving the fake clock a little on each try.
 * The timeout is much longer than the vitest default, because a run beside
 * the lint set or another suite can lose the processor for seconds.
 */
export const eventually = <T>(check: () => T | Promise<T>) => vi.waitFor(check, { timeout: 15_000, interval: 20 })

export const buttonsNamed = (within: ParentNode, name: string) =>
  Array.from(within.querySelectorAll<HTMLButtonElement>('button')).filter(
    (button) => button.getAttribute('aria-label') === name || button.textContent?.trim() === name
  )
