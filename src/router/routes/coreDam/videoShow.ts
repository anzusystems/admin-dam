import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { AEmptyRouterView } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

export const videoShowRoutes: RouteRecordRaw[] = [
  {
    path: '/video-show',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.videoShow.list',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.VIDEO_SHOW.LIST,
        component: () => import('@/views/coreDam/videoShow/VideoShowListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ],
          layout: 'AppLayoutDrawer',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.VIDEO_SHOW.EDIT,
        component: () => import('@/views/coreDam/videoShow/VideoShowEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ, ACL.DAM_VIDEO_SHOW_UPDATE],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.videoShow.edit',
        },
      },
      {
        path: ':id',
        component: AEmptyRouterView,
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ],
          layout: 'AppLayoutDrawer',
          breadcrumbT: 'breadcrumb.coreDam.videoShow.detail',
        },
        children: [
          {
            path: '',
            name: ROUTE.DAM.VIDEO_SHOW.DETAIL,
            component: () => import('@/views/coreDam/videoShow/VideoShowDetailView.vue'),
            meta: {
              requiresAuth: true,
              requiredPermissions: [ACL.DAM_VIDEO_SHOW_READ],
              layout: 'AppLayoutDrawer',
            },
          },
          {
            path: 'episode/:episodeId/edit',
            name: ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT,
            component: () => import('@/views/coreDam/videoShowEpisode/VideoShowEpisodeEditView.vue'),
            meta: {
              requiresAuth: true,
              requiredPermissions: [ACL.DAM_VIDEO_SHOW_EPISODE_READ, ACL.DAM_VIDEO_SHOW_EPISODE_UPDATE],
              layout: 'AppLayoutDrawer',
              breadcrumbT: 'breadcrumb.coreDam.videoShowEpisode.edit',
            },
          },
          {
            path: 'episode/:episodeId',
            name: ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL,
            component: () => import('@/views/coreDam/videoShowEpisode/VideoShowEpisodeDetailView.vue'),
            meta: {
              requiresAuth: true,
              requiredPermissions: [ACL.DAM_VIDEO_SHOW_EPISODE_READ],
              layout: 'AppLayoutDrawer',
              breadcrumbT: 'breadcrumb.coreDam.videoShowEpisode.detail',
            },
          },
        ],
      },
    ],
  },
]
