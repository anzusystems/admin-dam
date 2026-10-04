import { createNavigationErrorHandler, trackNavigation } from '@anzusystems/common-admin'
import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'

import { beforeEachRoute } from '@/router/beforeEachRoute'
import { addLegacyRedirects } from '@/router/legacyRedirects'
import { initRouteHistory } from '@/router/routeHistory'

initRouteHistory()

const vueRouter = createRouter({
  history: createWebHistory(),
  routes,
})

// First guard: a page skips its redirect after an async step once the user is navigating away or has left.
trackNavigation(vueRouter)

addLegacyRedirects(vueRouter)

if (import.meta.hot) {
  // a hot update replaces the generated routes, dropping anything added at runtime
  handleHotUpdate(vueRouter, () => {
    addLegacyRedirects(vueRouter)
  })
}

vueRouter.beforeEach(async (to, from) => {
  return await beforeEachRoute(to, from)
})

// No reload for a page's code that does not load: a running upload queue would go with it, the message says enough.
vueRouter.onError(createNavigationErrorHandler(vueRouter, { reloadOnChunkError: false }))

export const router = vueRouter
