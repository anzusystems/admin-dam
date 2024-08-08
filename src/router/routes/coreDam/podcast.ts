import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const podcastRoutes: RouteRecordRaw[] = [
  {
    path: '/podcast',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.podcast.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.PODCAST.LIST,
        component: () => import('@/views/coreDam/podcast/PodcastListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PODCAST_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.PODCAST.EDIT,
        component: () => import('@/views/coreDam/podcast/PodcastEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PODCAST_READ, ACL.DAM_PODCAST_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.podcast.edit',
        },
      },
      {
        path: ':id',
        component: AEmptyRouterView,
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_PODCAST_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.podcast.detail',
        },
        children: [
          {
            path: '',
            name: ROUTE.DAM.PODCAST.DETAIL,
            component: () => import('@/views/coreDam/podcast/PodcastDetailView.vue'),
            meta: {
              requiresAuth: true,
              requiredPermissions: [ACL.DAM_PODCAST_READ],
              layout: 'AppLayoutDrawer',
            },
          },
          {
            path: 'episode/:episodeId/edit',
            name: ROUTE.DAM.PODCAST_EPISODE.EDIT,
            component: () => import('@/views/coreDam/podcastEpisode/PodcastEpisodeEditView.vue'),
            meta: {
              requiresAuth: true,
              requiredPermissions: [ACL.DAM_PODCAST_EPISODE_READ, ACL.DAM_PODCAST_EPISODE_UPDATE],
              layout: 'AppLayoutDrawer',
              breadcrumbT: 'common.system.breadcrumb.edit',
            },
          },
          {
            path: 'episode/:episodeId',
            name: ROUTE.DAM.PODCAST_EPISODE.DETAIL,
            component: () => import('@/views/coreDam/podcastEpisode/PodcastEpisodeDetailView.vue'),
            meta: {
              requiresAuth: true,
              requiredPermissions: [ACL.DAM_PODCAST_EPISODE_READ],
              layout: 'AppLayoutDrawer',
              breadcrumbT: 'breadcrumb.coreDam.podcastEpisode.detail',
            },
          },
        ],
      },
    ],
  },
]
