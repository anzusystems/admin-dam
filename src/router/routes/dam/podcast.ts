import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/podcast'

export const podcastRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.PODCAST.LIST,
    component: () => import('@/views/coreDam/podcast/PodcastListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PODCAST_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.PODCAST.DETAIL,
    component: () => import('@/views/coreDam/podcast/PodcastDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PODCAST_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.PODCAST.EDIT,
    component: () => import('@/views/coreDam/podcast/PodcastEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PODCAST_VIEW, ACL.DAM_PODCAST_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
