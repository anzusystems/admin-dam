import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'

export const podcastRoutes: RouteRecordRaw[] = [
  {
    path: '/podcast',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.podcast',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.PODCAST.LIST,
        component: () => import('@/views/coreDam/podcast/PodcastListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PODCAST_VIEW],
          layout: 'AppLayoutSidebar',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.PODCAST.EDIT,
        component: () => import('@/views/coreDam/podcast/PodcastEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PODCAST_VIEW, ACL.DAM_PODCAST_UPDATE],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.PODCAST.DETAIL,
        component: () => import('@/views/coreDam/podcast/PodcastDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PODCAST_VIEW],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.detail',
        },
      },
    ],
  },
]
