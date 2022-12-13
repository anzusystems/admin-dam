import { ROUTE } from '@/router/routes'

const PATH = '/podcast-episode'

export const podcastEpisodeRoutes = [
  {
    path: PATH + '/:id',
    name: ROUTE.DAM.PODCAST_EPISODE.DETAIL,
    component: () => import('@/views/dam/podcastEpisode/PodcastEpisodeDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
  {
    path: PATH + '/:id/edit',
    name: ROUTE.DAM.PODCAST_EPISODE.EDIT,
    component: () => import('@/views/dam/podcastEpisode/PodcastEpisodeEditView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermissions: [],
      layout: 'AppLayoutSidebar',
    },
  },
]
