import { ROUTE } from '@/router/routes'

const PATH = '/video-show'

export const videoShowRoutes = [
  {
    path: PATH + '/list',
    name: ROUTE.DAM.VIDEO_SHOW.LIST,
    component: () => import('@/views/dam/videoShow/VideoShowListView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.VIDEO_SHOW.DETAIL,
    component: () => import('@/views/dam/videoShow/VideoShowDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.VIDEO_SHOW.EDIT,
    component: () => import('@/views/dam/videoShow/VideoShowEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
]
