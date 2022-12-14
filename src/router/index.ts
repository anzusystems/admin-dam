import { createRouter, createWebHistory } from 'vue-router'
import { beforeEachRoute } from '@/router/beforeEachRoute'
import NotFoundView from '@/views/system/NotFoundView.vue'
import { systemRoutes } from '@/router/routes/system'
import { ROUTE } from '@/router/routes'
import { assetRoutes } from '@/router/routes/dam/asset'
import { externalProviderRoutes } from '@/router/routes/dam/externalProvider'
import { userRoutes } from '@/router/routes/dam/user'
import { extSystemRoutes } from '@/router/routes/dam/extSystem'
import { assetLicenceRoutes } from '@/router/routes/dam/assetLicence'
import { permissionGroupRoutes } from '@/router/routes/dam/permissionGroup'
import { authorRoutes } from '@/router/routes/dam/author'
import { keywordRoutes } from '@/router/routes/dam/keyword'
import { distributionCategoryRoutes } from '@/router/routes/dam/distributionCategory'
import { distributionCategorySelectRoutes } from '@/router/routes/dam/distributionCategorySelect'
import { commonLogRoutes } from '@/router/common/log'
import { podcastRoutes } from '@/router/routes/dam/podcast'
import { podcastEpisodeRoutes } from '@/router/routes/dam/podcastEpisode'

const vueRouter = createRouter({
  history: createWebHistory(),
  routes: [
    ...assetRoutes,
    ...externalProviderRoutes,
    ...userRoutes,
    ...extSystemRoutes,
    ...assetLicenceRoutes,
    ...permissionGroupRoutes,
    ...authorRoutes,
    ...keywordRoutes,
    ...distributionCategoryRoutes,
    ...distributionCategorySelectRoutes,
    ...podcastRoutes,
    ...podcastEpisodeRoutes,
    ...commonLogRoutes,
    ...systemRoutes,
    {
      path: '/:pathMatch(.*)*',
      component: NotFoundView,
      name: ROUTE.SYSTEM.NOT_FOUND,
      meta: {
        requiresAuth: false,
        requiredPermissions: [],
        layout: 'AppLayoutFullscreen',
      },
    },
  ],
})

vueRouter.beforeEach(async (to, from, next) => {
  await beforeEachRoute(to, from, next)
})

export const router = vueRouter
