import { createRouter, createWebHistory } from 'vue-router'
import { routes as fileBasedRoutes, handleHotUpdate } from 'vue-router/auto-routes'
import { beforeEachRoute } from '@/router/beforeEachRoute'
import { assetRoutes } from '@/router/routes/coreDam/asset'
import { podcastRoutes } from '@/router/routes/coreDam/podcast'
import { videoShowRoutes } from '@/router/routes/coreDam/videoShow'

const vueRouter = createRouter({
  history: createWebHistory(),
  routes: [
    ...fileBasedRoutes,
    ...assetRoutes,
    ...podcastRoutes,
    ...videoShowRoutes,
  ],
})

if (import.meta.hot) {
  handleHotUpdate(vueRouter)
}

vueRouter.beforeEach(async (to) => {
  return await beforeEachRoute(to)
})

export const router = vueRouter
