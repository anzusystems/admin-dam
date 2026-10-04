import { trackNavigation } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { RouterView, createMemoryHistory, createRouter, useRoute } from 'vue-router'
import { createVuetify } from 'vuetify'

// An episode's address names its podcast as well. Opened under another podcast (an edited or stale link), the page
// puts the episode's own podcast into the address, so the breadcrumb and the way back name the right one.

const fetchEpisode = vi.hoisted(() => vi.fn())

vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showRecordWas: vi.fn(), showErrorsDefault: vi.fn(), showValidationError: vi.fn() }),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useFetchPodcastEpisode: () => ({ execute: fetchEpisode }),
}))
vi.mock('@/domains/coreDam/podcastEpisode/components/PodcastEpisodeDetail.vue', () => ({
  default: defineComponent(() => () => null),
}))
vi.mock('@/layouts/ActionbarWrapper.vue', () => ({ default: defineComponent(() => () => null) }))
vi.mock('vue-i18n', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useI18n: () => ({ t: (key: string) => key }),
}))

const PodcastEpisodeDetailView = (
  await import('@/domains/coreDam/podcastEpisode/components/PodcastEpisodeDetailView.vue')
).default

const PODCAST = '00000000-0000-4000-8000-000000000001'
const OTHER_PODCAST = '00000000-0000-4000-8000-000000000002'
const EPISODE = '00000000-0000-4000-8000-0000000000e1'
const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

const open = async (path: string) => {
  const page = defineComponent(() => () => null)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/podcasts', name: '/(coreDam)/podcasts', component: page },
      { path: '/podcasts/:id', name: '/(coreDam)/podcasts/[id]', component: page },
      {
        path: '/podcasts/:id/episodes/:episodeId',
        name: '/(coreDam)/podcasts/[id]/episodes/[episodeId]',
        component: PodcastEpisodeDetailView,
      },
      {
        path: '/podcasts/:id/episodes/:episodeId/edit',
        name: '/(coreDam)/podcasts/[id]/episodes/[episodeId]/edit',
        component: page,
      },
    ],
  })
  trackNavigation(router)
  await router.push(path)
  // As App.vue: the view keyed by the path.
  const app = createApp(
    defineComponent({
      setup() {
        const route = useRoute()
        return () => h(RouterView, { key: route.path })
      },
    })
  )
  app.use(router).use(createVuetify()).mount(document.createElement('div'))
  await settle()
  return { router, app }
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchEpisode.mockReset()
  fetchEpisode.mockResolvedValue({ id: EPISODE, podcast: PODCAST, texts: { title: 'Episode' } })
})

describe('a podcast episode opened by its address', () => {
  it('stays on an address that names its podcast', async () => {
    const { router, app } = await open(`/podcasts/${PODCAST}/episodes/${EPISODE}`)

    expect(router.currentRoute.value.path).toBe(`/podcasts/${PODCAST}/episodes/${EPISODE}`)
    app.unmount()
  })

  it('puts its own podcast into an address that names another one', async () => {
    const { router, app } = await open(`/podcasts/${OTHER_PODCAST}/episodes/${EPISODE}`)

    expect(router.currentRoute.value.path).toBe(`/podcasts/${PODCAST}/episodes/${EPISODE}`)
    app.unmount()
  })
})
