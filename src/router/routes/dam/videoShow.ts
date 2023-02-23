import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { ACL } from '@/types/Permission'

const PATH = '/video-show'

export const videoShowRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.VIDEO_SHOW.LIST,
    component: () => import('@/views/dam/videoShow/VideoShowListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_VIDEO_SHOW_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.VIDEO_SHOW.DETAIL,
    component: () => import('@/views/dam/videoShow/VideoShowDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_VIDEO_SHOW_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.VIDEO_SHOW.EDIT,
    component: () => import('@/views/dam/videoShow/VideoShowEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_VIDEO_SHOW_VIEW, ACL.DAM_VIDEO_SHOW_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
