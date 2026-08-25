import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import { beforeEachRoute } from '@/router/beforeEachRoute'
import { addLegacyRedirects } from '@/router/legacyRedirects'

const vueRouter = createRouter({
  history: createWebHistory(),
  routes,
})

addLegacyRedirects(vueRouter)

if (import.meta.hot) {
  // a hot update replaces the generated routes, dropping anything added at runtime
  handleHotUpdate(vueRouter, () => {
    addLegacyRedirects(vueRouter)
  })
}

vueRouter.beforeEach(async (to) => {
  return await beforeEachRoute(to)
})

export const router = vueRouter
