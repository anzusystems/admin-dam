import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { ACL } from '@/types/Permission'
import { AEmptyRouterView } from '@anzusystems/common-admin'

export const videoShowRoutes: RouteRecordRaw[] = [
  {
    path: '/video-show',
    component: AEmptyRouterView,
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutDrawer',
      breadcrumbT: 'breadcrumb.coreDam.videoShow',
    },
    children: [
      {
        path: '',
        name: ROUTE.DAM.VIDEO_SHOW.LIST,
        component: () => import('@/views/coreDam/videoShow/VideoShowListView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_VIDEO_SHOW_VIEW],
          layout: 'AppLayoutSidebar',
        },
      },
      {
        path: ':id/edit',
        name: ROUTE.DAM.VIDEO_SHOW.EDIT,
        component: () => import('@/views/coreDam/videoShow/VideoShowEditView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_VIDEO_SHOW_VIEW, ACL.DAM_VIDEO_SHOW_UPDATE],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.edit',
        },
      },
      {
        path: ':id',
        name: ROUTE.DAM.VIDEO_SHOW.DETAIL,
        component: () => import('@/views/coreDam/videoShow/VideoShowDetailView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: [ACL.DAM_VIDEO_SHOW_VIEW],
          layout: 'AppLayoutSidebar',
          breadcrumbT: 'common.system.breadcrumb.detail',
        },
      },
    ],
  },
]
