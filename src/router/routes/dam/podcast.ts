import { ROUTE } from '@/router/routes'

const PATH = '/podcast'

export const podcastRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.PODCAST.LIST,
    component: () => import('@/views/dam/podcast/PodcastListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.PODCAST.DETAIL,
    component: () => import('@/views/dam/podcast/PodcastDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.PODCAST.EDIT,
    component: () => import('@/views/dam/podcast/PodcastEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
]
