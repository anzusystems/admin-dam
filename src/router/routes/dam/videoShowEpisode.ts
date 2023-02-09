import { ROUTE } from '@/router/routes'

const PATH = '/video-show-episode'

export const videoShowEpisodeRoutes = [
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL,
    component: () => import('@/views/dam/videoShowEpisode/VideoShowEpisodeDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT,
    component: () => import('@/views/dam/videoShowEpisode/VideoShowEpisodeEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
]
