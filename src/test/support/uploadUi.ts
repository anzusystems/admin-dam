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

/* The application around a component of the upload, put together as `main.ts` puts it: the plugin of the library
 * with the client of the application, its messages (in English), Vuetify as the library configures it, the alerts
 * host of the layout and a user with grants. The config of DAM is written into the store of the library as its
 * load writes it. The one stand-in is the router, which knows a single page: the detail of an asset.
 *
 * Nothing of the application is replaced here. The test file replaces the client (`damClient`) by its fake server;
 * every module is evaluated anew for each start, so one case leaves the next neither a user, nor a cache, nor a
 * footer that is open - and time is faked from the start to `stopUploadUi`, so it leaves it no timer either. */

type AssetTypeConfig = Omit<DamExtSystemConfigItem, 'customMetadataPinnedAmount'> & {
  // A deployment can leave it out, whatever the type says.
  customMetadataPinnedAmount?: number
}

export interface UploadUiSetup {
  server: FakeDam
  /** What the user is granted. Left out: everything the upload components ask about. */
  grants?: string[]
  /** Over the config of the ext system, by asset type: keywords and authors are on and optional, two fields pinned. */
  extSystem?: Partial<Record<DamAssetTypeType, Partial<AssetTypeConfig>>>
  /** The custom form of an asset type; none has a field unless given here. */
  customForm?: Partial<Record<DamAssetTypeType, CustomDataFormElement[]>>
  /** The rows the queues hold before anything mounts. */
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

/** A custom form field as the config of DAM describes it: a text unless told otherwise. */
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
  // A component whose setup threw leaves Vue believing it is still inside that setup, and every store asked for
  // from then on is the store of that dead application: the cases after it would fail for no reason of their own.
  if (getCurrentInstance()) throw new Error('uploadUi: a component mounted before this start failed in its setup')
  /* The clock of every case is a fake one, and is thrown away when the case is over: a name lookup the caches put
   * off, a poll of a queue or a closing dialog of one case cannot fire in the next, into its server. A case moves
   * the time itself (`vi.advanceTimersByTimeAsync`), or waits with `vi.waitFor`, which moves it as it waits. */
  vi.useFakeTimers()
  vi.resetModules()
  // happy-dom has none, and a dialog listens on it for the size of the window.
  vi.stubGlobal('visualViewport', new EventTarget())
  // The addresses the server is asked, each whole: `server.requests` keeps them without their query.
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
  // What the application gives the plugin, the grants of creating a keyword and an author with it.
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
  // From the user and the config, as the start of the application: the ext system and the licence uploads go to.
  const { initCurrentExtSystemAndLicence } = await import('@/domains/coreDam/asset/composables/currentExtSystem')
  if (!(await initCurrentExtSystemAndLicence())) throw new Error('uploadUi: no ext system for the user')

  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const store = useUploadQueuesStore()
  const rows: Record<string, UploadQueueItem[]> = {}
  for (const [queueId, items] of Object.entries(setup.queues ?? {})) {
    rows[queueId] = seedQueue(store, queueId, items)
    // How many of its rows are settled, as the store counts them.
    store.recalculateQueueCounts(queueId)
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: { render: () => null } },
    ],
  })
  // The user is on a page, with no navigation on its way: a component asks about that before it reports a failure.
  await router.push('/')

  /** Mounts the component, imported only now, under the alerts host. Answers the element it is drawn in. */
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
    // The build registers the Vuetify components a template uses; here all of them are.
    for (const [name, vuetifyComponent] of Object.entries(vuetifyComponents)) {
      app.component(name, vuetifyComponent as Component)
    }
    app.mount(root)
    mounted.push(app)
    await nextTick()

    return root.querySelector<HTMLElement>('[data-under-test]')!
  }

  /** What the alerts host shows, oldest first. */
  const alerts = () =>
    Array.from(document.body.querySelectorAll('.a-alerts .v-alert')).map((alert) => alert.textContent?.trim() ?? '')

  return { store, rows, mount, alerts, asked, pinia, library }
}

export type UploadUi = Awaited<ReturnType<typeof startUploadUi>>

/** After each case: what was mounted is taken down, and the page is left empty. */
export const stopUploadUi = () => {
  mounted.forEach((app) => app.unmount())
  mounted = []
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (windowResized) setWindowWidth(WINDOW_WIDTH)
  windowResized = false
}

type HappyDomWindow = { happyDOM: { setViewport: (viewport: { width: number; height: number }) => void } }
const WINDOW_WIDTH = 1024
let windowResized = false

/** The width of the window from now on, until the case is over: Vuetify decides by it what is a small screen. */
export const setWindowWidth = (width: number) => {
  windowResized = true
  ;(window as unknown as HappyDomWindow).happyDOM.setViewport({ width, height: 768 })
}

/** The button of the open dialog that shows the text. */
export const dialogButton = (name: string) =>
  Array.from(document.body.querySelectorAll<HTMLButtonElement>('.v-dialog button')).find(
    (button) => button.textContent?.trim() === name
  ) ?? null

/**
 * Waits until the check passes, moving the fake clock a little at each try. Far longer than vitest waits by itself:
 * a run beside the lint set, or beside another suite, can lose the processor for seconds.
 */
export const eventually = <T>(check: () => T | Promise<T>) => vi.waitFor(check, { timeout: 15_000, interval: 20 })

/** The buttons under the element that show or are named by the text, in the order of the page. */
export const buttonsNamed = (within: ParentNode, name: string) =>
  Array.from(within.querySelectorAll<HTMLButtonElement>('button')).filter(
    (button) => button.getAttribute('aria-label') === name || button.textContent?.trim() === name
  )
