import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import type { RouteRecordRaw } from 'vue-router'

const PATH = '/podcast-episode'

export const podcastEpisodeRoutes: RouteRecordRaw[] = [
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.PODCAST_EPISODE.DETAIL,
    component: () => import('@/views/coreDam/podcastEpisode/PodcastEpisodeDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PODCAST_EPISODE_VIEW],
      layout: 'AppLayoutDrawer',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.PODCAST_EPISODE.EDIT,
    component: () => import('@/views/coreDam/podcastEpisode/PodcastEpisodeEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [ACL.DAM_PODCAST_EPISODE_VIEW, ACL.DAM_PODCAST_EPISODE_UPDATE],
      layout: 'AppLayoutDrawer',
    },
  },
]
