import { createRouter, createWebHistory } from 'vue-router'
import { routes as fileBasedRoutes, handleHotUpdate } from 'vue-router/auto-routes'
import { beforeEachRoute } from '@/router/beforeEachRoute'
import { assetRoutes } from '@/router/routes/coreDam/asset'
import { externalProviderRoutes } from '@/router/routes/coreDam/externalProvider'
import { userRoutes } from '@/router/routes/coreDam/user'
import { extSystemRoutes } from '@/router/routes/coreDam/extSystem'
import { assetLicenceRoutes } from '@/router/routes/coreDam/assetLicence'
import { authorRoutes } from '@/router/routes/coreDam/author'
import { keywordRoutes } from '@/router/routes/coreDam/keyword'
import { distributionCategoryRoutes } from '@/router/routes/coreDam/distributionCategory'
import { distributionCategorySelectRoutes } from '@/router/routes/coreDam/distributionCategorySelect'
import { podcastRoutes } from '@/router/routes/coreDam/podcast'
import { videoShowRoutes } from '@/router/routes/coreDam/videoShow'
import { jobRoutes } from '@/router/routes/coreDam/job'
import { assetLicenceGroupRoutes } from '@/router/routes/coreDam/assetLicenceGroup'
import { authorCleanPhraseRoutes } from '@/router/routes/coreDam/authorCleanPhrase'
import { publicExportRoutes } from '@/router/routes/coreDam/publicExport'

const vueRouter = createRouter({
  history: createWebHistory(),
  routes: [
    ...fileBasedRoutes,
    ...assetRoutes,
    ...externalProviderRoutes,
    ...userRoutes,
    ...extSystemRoutes,
    ...assetLicenceRoutes,
    ...assetLicenceGroupRoutes,
    ...authorRoutes,
    ...keywordRoutes,
    ...distributionCategoryRoutes,
    ...distributionCategorySelectRoutes,
    ...authorCleanPhraseRoutes,
    ...publicExportRoutes,
    ...podcastRoutes,
    ...videoShowRoutes,
    ...jobRoutes,
  ],
})

if (import.meta.hot) {
  handleHotUpdate(vueRouter)
}

vueRouter.beforeEach(async (to) => {
  return await beforeEachRoute(to)
})

export const router = vueRouter
