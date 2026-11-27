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

// Must be the first guard. It lets a page skip its redirect after an async step once the user navigates away.
trackNavigation(vueRouter)

addLegacyRedirects(vueRouter)

if (import.meta.hot) {
  // a hot update replaces the generated routes, dropping anything added at runtime
  handleHotUpdate(vueRouter, () => {
    addLegacyRedirects(vueRouter)
  })
}

vueRouter.beforeEach(async (to, from) => await beforeEachRoute(to, from))

// No reload when a page chunk fails to load. A running upload queue would be lost, and the message is enough.
vueRouter.onError(createNavigationErrorHandler(vueRouter, { reloadOnChunkError: false }))

export const router = vueRouter
