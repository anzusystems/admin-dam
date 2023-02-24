import { ROUTE } from '@/router/routes'
import type { RouteRecordRaw } from 'vue-router'
import { ACL } from '@/types/Permission'

const PATH = '/video-show-episode'

export const videoShowEpisodeRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL,
    component: () => import('@/views/dam/videoShowEpisode/VideoShowEpisodeDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_VIDEO_SHOW_EPISODE_VIEW],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT,
    component: () => import('@/views/dam/videoShowEpisode/VideoShowEpisodeEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_VIDEO_SHOW_EPISODE_VIEW, ACL.DAM_VIDEO_SHOW_EPISODE_UPDATE],
      layout: 'AppLayoutSidebar',
    },
  },
]
