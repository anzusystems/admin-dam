import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import { beforeEachRoute } from '@/router/beforeEachRoute'

const vueRouter = createRouter({
  history: createWebHistory(),
  routes,
})

if (import.meta.hot) {
  handleHotUpdate(vueRouter)
}

vueRouter.beforeEach(async (to) => {
  return await beforeEachRoute(to)
})

export const router = vueRouter
