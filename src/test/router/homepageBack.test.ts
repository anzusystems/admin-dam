import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import type { App } from 'vue'
import { RouterView, createMemoryHistory, createRouter } from 'vue-router'

import HomepageView from '@/domains/system/views/HomepageView.vue'

/* The page at `/` shows nothing of its own: it sends the user on to the list of assets. The logo of the pages with
 * the side menu leads to it. It takes the place of its own entry in the history: left there, the way back from the
 * list would end on it, and it would send the user to the list anew - a list read again, and no way back past it.
 * The real page under a router with a history kept in memory, as the application's is kept by the browser. */

const Page = defineComponent(() => () => null)

let app: App | undefined

/** The application at the page the user is on before they go to `/`. */
const openAt = async (path: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: HomepageView },
      { path: '/assets', name: '/(coreDam)/assets', component: Page },
      { path: '/settings', component: Page },
    ],
  })
  await router.push(path)
  app = createApp(defineComponent(() => () => h(RouterView))).use(router)
  app.mount(document.createElement('div'))

  return {
    at: () => router.currentRoute.value.path,
    /** A navigation, and the ones a page starts as it is drawn: all of them over. */
    go: async (move: () => unknown) => {
      await move()
      // The page at `/` navigates once it is mounted, which is after the navigation to it is over.
      for (let turn = 0; turn < 5; turn++) await new Promise((resolve) => setTimeout(resolve))
    },
    router,
  }
}

afterEach(() => {
  app?.unmount()
  app = undefined
})

describe('the page at the root address', () => {
  it('sends the user on to the list of assets', async () => {
    const application = await openAt('/settings')

    await application.go(() => application.router.push('/'))

    expect(application.at()).toBe('/assets')
  })

  it('leaves no entry of its own in the history: the way back from the list ends on the page before it', async () => {
    const application = await openAt('/settings')
    await application.go(() => application.router.push('/'))

    await application.go(() => application.router.back())

    expect(application.at()).toBe('/settings')
  })
})
