import { createRouter, createWebHistory } from 'vue-router'
import { beforeEachRoute } from '@/router/beforeEachRoute'
import { systemRoutes } from '@/router/routes/system'
import { ROUTE } from '@/router/routes'
import { assetRoutes } from '@/router/routes/coreDam/asset'
import { externalProviderRoutes } from '@/router/routes/coreDam/externalProvider'
import { userRoutes } from '@/router/routes/coreDam/user'
import { extSystemRoutes } from '@/router/routes/coreDam/extSystem'
import { assetLicenceRoutes } from '@/router/routes/coreDam/assetLicence'
import { permissionGroupRoutes } from '@/router/routes/common/permissionGroup'
import { authorRoutes } from '@/router/routes/coreDam/author'
import { keywordRoutes } from '@/router/routes/coreDam/keyword'
import { distributionCategoryRoutes } from '@/router/routes/coreDam/distributionCategory'
import { distributionCategorySelectRoutes } from '@/router/routes/coreDam/distributionCategorySelect'
import { commonLogRoutes } from '@/router/common/log'
import { podcastRoutes } from '@/router/routes/coreDam/podcast'
import { anzuUserRoutes } from '@/router/routes/common/anzuUser'
import { videoShowRoutes } from '@/router/routes/coreDam/videoShow'
import { jobRoutes } from '@/router/routes/coreDam/job'
import HomepageView from '@/views/system/HomepageView.vue'
import { ANotFoundView } from '@anzusystems/common-admin'

const vueRouter = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomepageView,
      name: ROUTE.SYSTEM.HOMEPAGE,
      meta: {
        requiresAuth: true,
        requiredPermissions: [],
        layout: 'AppLayoutFullscreen',
      },
    },
    ...assetRoutes,
    ...externalProviderRoutes,
    ...userRoutes,
    ...extSystemRoutes,
    ...assetLicenceRoutes,
    ...permissionGroupRoutes,
    ...anzuUserRoutes,
    ...authorRoutes,
    ...keywordRoutes,
    ...distributionCategoryRoutes,
    ...distributionCategorySelectRoutes,
    ...podcastRoutes,
    ...videoShowRoutes,
    ...jobRoutes,
    ...commonLogRoutes,
    ...systemRoutes,
    {
      path: '/:pathMatch(.*)*',
      component: ANotFoundView,
      props: { returnRouteName: ROUTE.SYSTEM.HOMEPAGE },
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
